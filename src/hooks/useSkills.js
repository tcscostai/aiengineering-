import { useState, useEffect, useCallback } from 'react'
import * as skillService from '../services/skillService'

export function useSkills() {
  const [skills, setSkills] = useState(() => skillService.getAllSkills())

  const refresh = useCallback(() => {
    setSkills(skillService.getAllSkills())
  }, [])

  useEffect(() => {
    const handler = () => refresh()
    window.addEventListener('horizon-storage', handler)
    window.addEventListener('storage', handler)
    return () => {
      window.removeEventListener('horizon-storage', handler)
      window.removeEventListener('storage', handler)
    }
  }, [refresh])

  return {
    skills,
    refresh,
    getForCategory: (category) => skillService.getSkillsForCategory(category),
    certified: skills.filter((s) => s.certified),
    topReused: skillService.getTopReusedSkills(),
    metrics: skillService.computeSkillMetrics(),
  }
}
