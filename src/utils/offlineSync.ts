import { teacherService } from '../services/teacherService'
import { AttendanceStatus } from '../types/teacher'

// --- Types ---

export interface PendingAssignment {
  id: string
  grading_period_id: string
  title: string
  max_score: number
  due_date: string
  classId: string
}

export interface PendingGrade {
  assignment_id: string
  student_id: string
  score: number
  classId: string
}

export interface PendingAttendance {
  id: string
  name: string
  record_date: string
  classId: string
}

export interface PendingAttendanceRecord {
  attendance_id: string
  student_id: string
  status: AttendanceStatus
  classId: string
}

// --- IndexedDB Helper ---

const DB_NAME = 'OfflineSyncDB'
const DB_VERSION = 2

const STORES = {
  ASSIGNMENTS: 'pending_assignments',
  GRADES: 'pending_grades',
  ATTENDANCES: 'pending_attendances',
  ATTENDANCE_RECORDS: 'pending_attendance_records',
  CACHE: 'data_cache'
}

class OfflineDB {
  private db: IDBDatabase | null = null

  async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        const oldVersion = event.oldVersion

        Object.values(STORES).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            // Use 'id' for most stores
            db.createObjectStore(storeName, { keyPath: 'id' })
          }
        })

        // If version 1 and upgraded to 2, we might want to ensure 'id' keyPath for all
        // In this case, all stores already used 'id' if they were created in v1
        // But let's be explicit if we add new ones
      }

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result
        resolve(this.db)
      }

      request.onerror = (event) => {
        reject((event.target as IDBOpenDBRequest).error)
      }
    })
  }

  // Generic methods
  async add(storeName: string, data: any): Promise<void> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.put(data)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async getAll(storeName: string): Promise<any[]> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly')
      const store = transaction.objectStore(storeName)
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async clear(storeName: string): Promise<void> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.clear()
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }

  async delete(storeName: string, id: any): Promise<void> {
    const db = await this.getDB()
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite')
      const store = transaction.objectStore(storeName)
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
}

const db = new OfflineDB()

// --- Sync Logic ---

export const offlineSync = {
  // Assignments
  async saveAssignmentLocally(assignment: PendingAssignment) {
    await db.add(STORES.ASSIGNMENTS, assignment)
  },

  async getPendingAssignments(classId?: string) {
    const all = await db.getAll(STORES.ASSIGNMENTS) as PendingAssignment[]
    return classId ? all.filter(a => a.classId === classId) : all
  },

  // Grades
  async saveGradeLocally(grade: PendingGrade) {
    const id = `${grade.assignment_id}_${grade.student_id}`
    await db.add(STORES.GRADES, { ...grade, id })
  },

  async getPendingGrades(classId?: string) {
    const all = await db.getAll(STORES.GRADES) as (PendingGrade & { id: string })[]
    return classId ? all.filter(g => g.classId === classId) : all
  },

  // Attendance
  async saveAttendanceLocally(attendance: PendingAttendance) {
    await db.add(STORES.ATTENDANCES, attendance)
  },

  async getPendingAttendances(classId?: string) {
    const all = await db.getAll(STORES.ATTENDANCES) as PendingAttendance[]
    return classId ? all.filter(a => a.classId === classId) : all
  },

  async saveAttendanceRecordLocally(record: PendingAttendanceRecord) {
    const id = `${record.attendance_id}_${record.student_id}`
    await db.add(STORES.ATTENDANCE_RECORDS, { ...record, id })
  },

  async getPendingAttendanceRecords(classId?: string) {
    const all = await db.getAll(STORES.ATTENDANCE_RECORDS) as (PendingAttendanceRecord & { id: string })[]
    return classId ? all.filter(r => r.classId === classId) : all
  },

  // Main Sync Function
  async syncAll() {
    if (!navigator.onLine) return

    const assignments = await this.getPendingAssignments()
    const grades = await this.getPendingGrades()
    const attendances = await this.getPendingAttendances()
    const records = await this.getPendingAttendanceRecords()

    if (assignments.length === 0 && grades.length === 0 && attendances.length === 0 && records.length === 0) {
      return
    }

    // Group by classId for bulk sync
    const classIdsSet = new Set<string>()
    assignments.forEach(a => classIdsSet.add(a.classId))
    grades.forEach(g => classIdsSet.add(g.classId))
    attendances.forEach(a => classIdsSet.add(a.classId))
    records.forEach(r => classIdsSet.add(r.classId))
    
    const classIds = Array.from(classIdsSet)

    for (const classId of classIds) {
      const classAssignments = assignments.filter(a => a.classId === classId)
      const classGrades = grades.filter(g => g.classId === classId)
      const classAttendances = attendances.filter(a => a.classId === classId)
      const classRecords = records.filter(r => r.classId === classId)

      // Sync Assignments and Grades
      if (classAssignments.length > 0 || classGrades.length > 0) {
        const { error } = await teacherService.syncOfflineAssignmentsAndGrades({
          classId,
          assignments: classAssignments.map(({ classId, ...rest }) => ({
              id: rest.id,
              grading_period_id: rest.grading_period_id,
              title: rest.title,
              max_score: rest.max_score,
              due_date: rest.due_date
          })),
          grades: classGrades.map(({ classId, id, ...rest }) => ({
              assignment_id: rest.assignment_id,
              student_id: rest.student_id,
              score: rest.score
          }))
        })

        if (!error) {
          // Clear synced items from IDB
          for (const a of classAssignments) await db.delete(STORES.ASSIGNMENTS, a.id)
          for (const g of classGrades) await db.delete(STORES.GRADES, g.id)
        } else {
            console.error('Failed to sync assignments/grades for class', classId, error)
        }
      }

      // Sync Attendance
      if (classAttendances.length > 0 || classRecords.length > 0) {
        const { error } = await teacherService.syncOfflineAttendanceFull({
          classId,
          attendances: classAttendances.map(({ classId, ...rest }) => ({
              id: rest.id,
              name: rest.name,
              record_date: rest.record_date
          })),
          records: classRecords.map(({ classId, id, ...rest }) => ({
              attendance_id: rest.attendance_id,
              student_id: rest.student_id,
              status: rest.status
          }))
        })

        if (!error) {
          for (const a of classAttendances) await db.delete(STORES.ATTENDANCES, a.id)
          for (const r of classRecords) await db.delete(STORES.ATTENDANCE_RECORDS, r.id)
        } else {
            console.error('Failed to sync attendance for class', classId, error)
        }
      }
    }
  },

  // Cache fetched data
  async cacheData(key: string, data: any) {
    await db.add(STORES.CACHE, { id: key, data, timestamp: Date.now() })
  },

  async getCachedData(key: string) {
    const cached = await db.getAll(STORES.CACHE)
    const entry = cached.find(c => c.id === key)
    return entry ? entry.data : null
  }
}
