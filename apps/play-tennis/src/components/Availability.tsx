import { formatHourCompact } from '../dateUtils'
import { useState } from 'react'
import { getAvailability, saveAvailability } from '../store'
import { PlayerProfile, AvailabilitySlot, DayOfWeek } from '../types'
import { useToast } from './Toast'

interface Props {
  profile: PlayerProfile
}

const DAYS: { key: DayOfWeek; label: string; short: string }[] = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
]

const QUICK_SLOTS: { label: string; slots: AvailabilitySlot[] }[] = [
  { label: 'Weekday evenings', slots: [
    { day: 'monday', startHour: 18, endHour: 21 },
    { day: 'tuesday', startHour: 18, endHour: 21 },
    { day: 'wednesday', startHour: 18, endHour: 21 },
    { day: 'thursday', startHour: 18, endHour: 21 },
    { day: 'friday', startHour: 18, endHour: 21 },
  ]},
  { label: 'Saturday mornings', slots: [{ day: 'saturday', startHour: 8, endHour: 12 }]},
  { label: 'Saturday afternoons', slots: [{ day: 'saturday', startHour: 13, endHour: 17 }]},
  { label: 'Sunday mornings', slots: [{ day: 'sunday', startHour: 8, endHour: 12 }]},
  { label: 'Sunday afternoons', slots: [{ day: 'sunday', startHour: 13, endHour: 17 }]},
]

export default function AvailabilityTab({ profile }: Props) {
  const { showSuccess } = useToast()
  const [slots, setSlots] = useState<AvailabilitySlot[]>(() => getAvailability(profile.id))
  const [editing, setEditing] = useState(false)
  const [availMode, setAvailMode] = useState<'quick' | 'custom'>('quick')
  const [detailDay, setDetailDay] = useState<DayOfWeek>('monday')
  const [detailStart, setDetailStart] = useState(9)
  const [detailEnd, setDetailEnd] = useState(12)

  function toggleQuickSlot(quickSlot: { label: string; slots: AvailabilitySlot[] }) {
    const allPresent = quickSlot.slots.every(qs =>
      slots.some(s => s.day === qs.day && s.startHour === qs.startHour && s.endHour === qs.endHour)
    )
    if (allPresent) {
      setSlots(slots.filter(s =>
        !quickSlot.slots.some(qs => qs.day === s.day && qs.startHour === s.startHour && qs.endHour === s.endHour)
      ))
    } else {
      const newSlots = quickSlot.slots.filter(qs =>
        !slots.some(s => s.day === qs.day && s.startHour === qs.startHour && s.endHour === qs.endHour)
      )
      setSlots([...slots, ...newSlots])
    }
  }

  function isQuickSlotActive(quickSlot: { slots: AvailabilitySlot[] }): boolean {
    return quickSlot.slots.every(qs =>
      slots.some(s => s.day === qs.day && s.startHour === qs.startHour && s.endHour === qs.endHour)
    )
  }

  function addDetailedSlot() {
    const exists = slots.some(s => s.day === detailDay && s.startHour === detailStart && s.endHour === detailEnd)
    if (!exists && detailStart < detailEnd) {
      setSlots([...slots, { day: detailDay, startHour: detailStart, endHour: detailEnd }])
    }
  }

  function removeSlot(index: number) {
    setSlots(slots.filter((_, i) => i !== index))
  }

  function handleSave() {
    saveAvailability(profile.id, slots)
    setEditing(false)
    showSuccess('Changes saved')
  }

  function handleCancel() {
    setSlots(getAvailability(profile.id))
    setEditing(false)
    setAvailMode('quick')
  }

  return (
    <div className="tab-content-inner">
      <div className="card profile-section">
        <h3 className="profile-section-title">
          <span>Your Availability</span>
          {!editing && <button className="btn btn-small" onClick={() => setEditing(true)}>Edit</button>}
        </h3>
        <p className="text-muted" style={{ marginBottom: 12 }}>The more times you add, the more matches Rally can auto-schedule</p>

        {!editing ? (
          <div className="availability-current">
            {slots.length === 0 ? (
              <div>
                <p className="subtle">No availability set</p>
                <p style={{ color: 'var(--color-warning, #e6a200)', fontSize: '0.85rem', marginTop: 8 }}>Set your availability to get better match times</p>
              </div>
            ) : (
              slots.map((slot, i) => {
                const dayInfo = DAYS.find(d => d.key === slot.day)
                return (
                  <div key={i} className="availability-slot-item">
                    <span className="availability-slot-day">{dayInfo?.short ?? slot.day}</span>
                    <span className="availability-slot-hours">{formatHourCompact(slot.startHour).replace(':00', '')}–{formatHourCompact(slot.endHour).replace(':00', '')}</span>
                  </div>
                )
              })
            )}
          </div>
        ) : (
          <>
            <div className="avail-segmented-control">
              <button
                className={`avail-segment-btn ${availMode === 'quick' ? 'active' : ''}`}
                onClick={() => setAvailMode('quick')}
              >
                Quick Presets
              </button>
              <button
                className={`avail-segment-btn ${availMode === 'custom' ? 'active' : ''}`}
                onClick={() => setAvailMode('custom')}
              >
                Custom Times
              </button>
            </div>

            {availMode === 'quick' && (
              <div className="quick-slots">
                {QUICK_SLOTS.map(qs => (
                  <button
                    key={qs.label}
                    className={`quick-slot-btn ${isQuickSlotActive(qs) ? 'selected' : ''}`}
                    onClick={() => toggleQuickSlot(qs)}
                  >
                    <span className="quick-slot-check">{isQuickSlotActive(qs) ? '✓' : ''}</span>
                    {qs.label}
                  </button>
                ))}
              </div>
            )}

            {availMode === 'custom' && (
              <div className="detailed-add-row">
                <select value={detailDay} onChange={e => setDetailDay(e.target.value as DayOfWeek)}>
                  {DAYS.map(d => <option key={d.key} value={d.key}>{d.short}</option>)}
                </select>
                <select value={detailStart} onChange={e => setDetailStart(Number(e.target.value))}>
                  {Array.from({ length: 16 }, (_, i) => i + 6).map(h => (
                    <option key={h} value={h}>{formatHourCompact(h)}</option>
                  ))}
                </select>
                <span>–</span>
                <select value={detailEnd} onChange={e => setDetailEnd(Number(e.target.value))}>
                  {Array.from({ length: 16 }, (_, i) => i + 7).map(h => (
                    <option key={h} value={h}>{formatHourCompact(h)}</option>
                  ))}
                </select>
                <button className="btn btn-small" onClick={addDetailedSlot}>Add</button>
              </div>
            )}

            {slots.length > 0 && (
              <div className="availability-current">
                {slots.map((slot, i) => {
                  const dayInfo = DAYS.find(d => d.key === slot.day)
                  return (
                    <div key={i} className="availability-slot-item">
                      <span className="availability-slot-day">{dayInfo?.label ?? slot.day}</span>
                      <span className="availability-slot-hours">{formatHourCompact(slot.startHour)}–{formatHourCompact(slot.endHour)}</span>
                      <button className="btn-icon" onClick={() => removeSlot(i)}>✕</button>
                    </div>
                  )
                })}
              </div>
            )}

            <div className="btn-row">
              <button className="btn btn-primary" onClick={handleSave}>Save</button>
              <button className="btn" onClick={handleCancel}>Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
