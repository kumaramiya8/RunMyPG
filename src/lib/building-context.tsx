'use client'

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from './supabase'
import { useAuth } from './auth-context'

interface Building {
  id: string
  name: string
  address?: string
  city?: string
}

interface BuildingContextValue {
  selectedBuildingId: string | null  // null = "All Properties"
  selectedBuildingName: string | null
  availableBuildings: Building[]
  loading: boolean
  selectBuilding: (buildingId: string | null) => void
}

const STORAGE_KEY = 'runmypg_selected_building'

const BuildingContext = createContext<BuildingContextValue | null>(null)

export function BuildingProvider({ children }: { children: ReactNode }) {
  const { orgId } = useAuth()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Fetch buildings when orgId changes
  useEffect(() => {
    if (!orgId) {
      setBuildings([])
      setSelectedId(null)
      setLoading(false)
      return
    }

    setLoading(true)
    supabase
      .from('buildings')
      .select('id, name, address, city')
      .eq('org_id', orgId)
      .order('created_at')
      .then(({ data }) => {
        const bldgs = data || []
        setBuildings(bldgs)

        // Restore from localStorage or auto-select
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored && bldgs.some((b) => b.id === stored)) {
          setSelectedId(stored)
        } else if (bldgs.length === 1) {
          // Auto-select if only one building
          setSelectedId(bldgs[0].id)
          localStorage.setItem(STORAGE_KEY, bldgs[0].id)
        } else {
          // Multiple buildings or none — show "All Properties"
          setSelectedId(null)
        }

        setLoading(false)
      })
  }, [orgId])

  const selectBuilding = useCallback((buildingId: string | null) => {
    setSelectedId(buildingId)
    if (buildingId) {
      localStorage.setItem(STORAGE_KEY, buildingId)
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [])

  const selectedBuildingName = selectedId
    ? buildings.find((b) => b.id === selectedId)?.name || null
    : null

  return (
    <BuildingContext.Provider value={{
      selectedBuildingId: selectedId,
      selectedBuildingName,
      availableBuildings: buildings,
      loading,
      selectBuilding,
    }}>
      {children}
    </BuildingContext.Provider>
  )
}

export function useBuilding() {
  const ctx = useContext(BuildingContext)
  if (!ctx) throw new Error('useBuilding must be used within BuildingProvider')
  return ctx
}
