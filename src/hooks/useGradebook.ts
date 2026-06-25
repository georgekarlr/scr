import { useState, useCallback } from 'react'
import { teacherService } from '../services/teacherService'
import { ClassGradebook } from '../types/grade'

export const useGradebook = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gradebook, setGradebook] = useState<ClassGradebook[]>([])

  const fetchGradebook = useCallback(async (classId: string) => {
    setLoading(true)
    setError(null)
    try {
      const { data, error: fetchError } = await teacherService.getClassGradebook(classId)
      console.log('Fetched gradebook:', data)
      if (fetchError) {
        setError(fetchError.message)
      } else {
        setGradebook(data || [])
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [])

  const clearGradebook = useCallback(() => {
    setGradebook([])
    setError(null)
  }, [])

  return {
    gradebook,
    loading,
    error,
    fetchGradebook,
    clearGradebook
  }
}
