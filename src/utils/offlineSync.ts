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
  action_status: 'updated' | 'deleted' | 'none'
}

export interface PendingGrade {
  assignment_id: string
  student_id: string
  score: number
  classId: string
  action_status: 'updated' | 'deleted' | 'none'
}

export interface DeletedAssignment {
  id: string
  classId: string
}

export interface DeletedAttendance {
  id: string
  classId: string
}

export interface PendingAttendance {
  id: string
  name: string
  record_date: string
  classId: string
  action_status: 'updated' | 'deleted' | 'none'
}

export interface PendingAttendanceRecord {
  attendance_id: string
  student_id: string
  status: AttendanceStatus
  classId: string
}

// --- IndexedDB Helper ---

let currentDBName = 'OfflineSyncDB'
const DB_VERSION = 1

const STORES = {
  ASSIGNMENTS: 'pending_assignments',
  GRADES: 'pending_grades',
  ATTENDANCES: 'pending_attendances',
  ATTENDANCE_RECORDS: 'pending_attendance_records',
  DELETED_ASSIGNMENTS: 'deleted_assignments',
  DELETED_ATTENDANCES: 'deleted_attendances',
  CACHE: 'data_cache'
}

class OfflineDB {
  private db: IDBDatabase | null = null
  private dbName: string = currentDBName

  async getDB(): Promise<IDBDatabase> {
    const targetDBName = currentDBName
    
    if (this.db && this.dbName === targetDBName) return this.db

    // If db name changed or first connection, close old connection if it exists
    if (this.db) {
      this.db.close()
      this.db = null
    }

    this.dbName = targetDBName

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, DB_VERSION)

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

type SyncCallback = () => void
const syncCallbacks: SyncCallback[] = []

export const offlineSync = {
  setUserEmail(email: string | null) {
    const newName = email ? `OfflineSyncDB_${email}` : 'OfflineSyncDB'
    if (currentDBName !== newName) {
      currentDBName = newName
      // Force immediate re-connection check on next DB access
      db.getDB().catch(err => console.error('Failed to pre-open DB:', err))
    }
  },

  onSyncSuccess(callback: SyncCallback) {
    syncCallbacks.push(callback)
    return () => {
      const index = syncCallbacks.indexOf(callback)
      if (index > -1) syncCallbacks.splice(index, 1)
    }
  },

  notifySyncSuccess() {
    syncCallbacks.forEach(cb => cb())
  },
  // Assignments
  async saveAssignmentLocally(assignment: PendingAssignment) {
    await db.add(STORES.ASSIGNMENTS, { ...assignment, action_status: 'updated' })
  },

  async deleteAssignmentLocally(assignmentId: string, classId: string, isNewlyCreatedOffline: boolean) {
    if (isNewlyCreatedOffline) {
      await db.delete(STORES.ASSIGNMENTS, assignmentId)
      // Also clean up any pending grades for this assignment
      const pendingGrades = await this.getPendingGrades(classId)
      for (const grade of pendingGrades) {
        if (grade.assignment_id === assignmentId) {
          await db.delete(STORES.GRADES, grade.id)
        }
      }
      return
    }

    // Otherwise, mark it for deletion
    // Get existing assignment data if possible to keep it in the assignments store but with deleted status
    const allAssignments = await db.getAll(STORES.ASSIGNMENTS) as PendingAssignment[]
    const existing = allAssignments.find(a => a.id === assignmentId)
    
    if (existing) {
        await db.add(STORES.ASSIGNMENTS, { ...existing, action_status: 'deleted' })
    } else {
        // We might not have it in pending_assignments if it was already synced
        // We still need to track it as deleted
        await db.add(STORES.DELETED_ASSIGNMENTS, { id: assignmentId, classId })
    }

    // Also mark related grades as deleted
    const allGrades = await db.getAll(STORES.GRADES) as (PendingGrade & { id: string })[]
    const relatedGrades = allGrades.filter(g => g.assignment_id === assignmentId)
    for (const grade of relatedGrades) {
        await db.add(STORES.GRADES, { ...grade, action_status: 'deleted' })
    }
  },

  async restoreAssignmentLocally(assignmentId: string) {
    // 1. Remove from deleted_assignments store
    await db.delete(STORES.DELETED_ASSIGNMENTS, assignmentId)
    
    // 2. If it exists in pending_assignments with 'deleted' status, change to 'updated' or remove if it was just 'none'
    const allAssignments = await db.getAll(STORES.ASSIGNMENTS) as PendingAssignment[]
    const existing = allAssignments.find(a => a.id === assignmentId)
    if (existing && existing.action_status === 'deleted') {
        // If it was already in pending (e.g. updated offline then deleted), revert to updated
        // For simplicity, let's just set it back to 'updated'
        await db.add(STORES.ASSIGNMENTS, { ...existing, action_status: 'updated' })
    }

    // 3. Restore grades (set action_status back to updated)
    const allGrades = await db.getAll(STORES.GRADES) as (PendingGrade & { id: string })[]
    const relatedGrades = allGrades.filter(g => g.assignment_id === assignmentId)
    for (const grade of relatedGrades) {
        if (grade.action_status === 'deleted') {
            await db.add(STORES.GRADES, { ...grade, action_status: 'updated' })
        }
    }
  },

  async getPendingAssignments(classId?: string) {
    const all = await db.getAll(STORES.ASSIGNMENTS) as PendingAssignment[]
    return classId ? all.filter(a => a.classId === classId) : all
  },

  // Grades
  async saveGradeLocally(grade: PendingGrade) {
    const id = `${grade.assignment_id}_${grade.student_id}`
    await db.add(STORES.GRADES, { ...grade, id, action_status: 'updated' })
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

  async getDeletedAssignments(classId?: string) {
    const all = await db.getAll(STORES.DELETED_ASSIGNMENTS) as DeletedAssignment[]
    return classId ? all.filter(a => a.classId === classId) : all
  },

  async addDeletedAttendance(id: string, classId: string) {
    await db.add(STORES.DELETED_ATTENDANCES, { id, classId })
  },

  async deleteAttendanceLocally(id: string, classId: string, isPending: boolean) {
    if (isPending) {
        await db.delete(STORES.ATTENDANCES, id)
    } else {
        await this.addDeletedAttendance(id, classId)
    }
  },

  async restoreAttendanceLocally(id: string) {
    await db.delete(STORES.DELETED_ATTENDANCES, id)
  },

  async getDeletedAttendances(classId?: string) {
    const all = await db.getAll(STORES.DELETED_ATTENDANCES) as DeletedAttendance[]
    return classId ? all.filter(a => a.classId === classId) : all
  },

  async clearCache(keys: string[]) {
    for (const key of keys) {
      await db.delete(STORES.CACHE, key)
    }
  },

  // Main Sync Function
  async syncAll() {
    if (!navigator.onLine) return

    const assignments = await this.getPendingAssignments()
    const grades = await this.getPendingGrades()
    const attendances = await this.getPendingAttendances() as PendingAttendance[]
    const records = await this.getPendingAttendanceRecords()
    const deletedAssignments = await this.getDeletedAssignments()
    const deletedAttendances = await this.getDeletedAttendances()

    if (assignments.length === 0 && grades.length === 0 && attendances.length === 0 && records.length === 0 && deletedAssignments.length === 0 && deletedAttendances.length === 0) {
      return
    }

    // Group by classId for bulk sync
    const classIdsSet = new Set<string>()
    assignments.forEach(a => classIdsSet.add(a.classId))
    grades.forEach(g => classIdsSet.add(g.classId))
    attendances.forEach(a => classIdsSet.add(a.classId))
    records.forEach(r => classIdsSet.add(r.classId))
    deletedAssignments.forEach(d => classIdsSet.add(d.classId))
    deletedAttendances.forEach(d => classIdsSet.add(d.classId))
    
    const classIds = Array.from(classIdsSet)

    let syncOccurred = false

    for (const classId of classIds) {
      const classAssignments = assignments.filter(a => a.classId === classId)
      const classGrades = grades.filter(g => g.classId === classId)
      const classAttendances = attendances.filter(a => a.classId === classId)
      const classRecords = records.filter(r => r.classId === classId)
      const classDeletedAssignments = deletedAssignments.filter(d => d.classId === classId) 
      const classDeletedAttendances = deletedAttendances.filter(d => d.classId === classId)

      // Sync Assignments and Grades
      if (classAssignments.length > 0 || classGrades.length > 0 || classDeletedAssignments.length > 0) {
        const { error } = await teacherService.syncOfflineAssignmentsAndGrades({
          classId,
          assignments: classAssignments.map(({ classId, ...rest }) => ({
              id: rest.id,
              grading_period_id: rest.grading_period_id,
              title: rest.title,
              max_score: rest.max_score,
              due_date: rest.due_date,
              action_status: rest.action_status
          })),
          grades: classGrades.map(({ classId, id, ...rest }) => ({
              assignment_id: rest.assignment_id,
              student_id: rest.student_id,
              score: rest.score,
              action_status: rest.action_status
          })),
          deleted_assignments: classDeletedAssignments.map(d => d.id)
        })

        if (!error) {
          syncOccurred = true
          // Clear synced items from IDB
          for (const a of classAssignments) await db.delete(STORES.ASSIGNMENTS, a.id)
          for (const g of classGrades) await db.delete(STORES.GRADES, g.id)
          for (const d of classDeletedAssignments) await db.delete(STORES.DELETED_ASSIGNMENTS, d.id)
          
          // Clear cache to force refetch
          const gradingPeriodIds = new Set(classAssignments.map(a => a.grading_period_id))
          const cacheKeys = [`assignments_${classId}`, `roster_${classId}`]
          gradingPeriodIds.forEach(gpId => cacheKeys.push(`assignments_${classId}_${gpId}`, `grades_${classId}_${gpId}`))
          await this.clearCache(cacheKeys)
        } else {
            console.error('Failed to sync assignments/grades for class', classId, error)
        }
      }

      // Sync Attendance
      if (classAttendances.length > 0 || classRecords.length > 0 || classDeletedAttendances.length > 0) {
        const { error } = await teacherService.syncOfflineAttendanceFull({
          classId,
          attendances: classAttendances.map(({ classId, ...rest }) => ({
              id: rest.id,
              name: rest.name,
              record_date: rest.record_date,
              action_status: rest.action_status
          })),
          records: classRecords.map(({ classId, id, ...rest }) => ({
              attendance_id: rest.attendance_id,
              student_id: rest.student_id,
              status: rest.status
          })),
          deleted_attendances: classDeletedAttendances.map(d => d.id)
        })

        if (!error) {
          syncOccurred = true
          for (const a of classAttendances) await db.delete(STORES.ATTENDANCES, a.id)
          for (const r of classRecords) await db.delete(STORES.ATTENDANCE_RECORDS, r.id)
          for (const d of classDeletedAttendances) await db.delete(STORES.DELETED_ATTENDANCES, d.id)
          
          // Clear cache to force refetch
          const cacheKeys = [`sessions_${classId}`, `all_attendance_records_${classId}`]
          classAttendances.forEach(a => cacheKeys.push(`records_${a.id}`))
          classDeletedAttendances.forEach(d => cacheKeys.push(`records_${d.id}`))
          await this.clearCache(cacheKeys)
        } else {
            console.error('Failed to sync attendance for class', classId, error)
        }
      }
    }

    if (syncOccurred) {
      this.notifySyncSuccess()
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
