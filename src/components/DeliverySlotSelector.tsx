import { useEffect, useMemo, useState } from 'react'
import {
  availableDeliveryDayDefs,
  buildHalfHourDeliverySlots,
  deliveryDayLabel,
  deliveryDayShortDate,
  deliverySlotNow,
  firstAvailableDeliveryDayKey,
  scheduledDaySelection,
  selectionForHalfHourSlot,
  type DeliveryDayKey,
  type DeliverySlotSelection,
  type MealCategory,
} from '../lib/deliverySlots'
import './DeliverySlotSelector.css'

interface DeliverySlotSelectorProps {
  categories: MealCategory[]
  selected: DeliverySlotSelection
  onSelected: (slot: DeliverySlotSelection) => void
  allowDeliverNow: boolean
  loading?: boolean
  notice?: string | null
  kitchenName?: string | null
}

export function DeliverySlotSelector({
  categories,
  selected,
  onSelected,
  allowDeliverNow,
  loading = false,
  notice,
  kitchenName,
}: DeliverySlotSelectorProps) {
  const availableDays = useMemo(
    () => availableDeliveryDayDefs(categories),
    [categories],
  )
  const firstDay = availableDays[0]?.key ?? null
  const [dayKey, setDayKey] = useState<DeliveryDayKey>(
    () => selected.dayKey ?? firstDay ?? 'today',
  )
  const [scheduleExpanded, setScheduleExpanded] = useState(
    () => !allowDeliverNow || !selected.isNow,
  )

  useEffect(() => {
    if (!allowDeliverNow && selected.isNow) {
      const nextDay = firstAvailableDeliveryDayKey(categories) ?? 'today'
      setDayKey(nextDay)
      setScheduleExpanded(true)
      onSelected(scheduledDaySelection(nextDay))
    }
    // Only re-force schedule when instant becomes unavailable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allowDeliverNow, categories])

  useEffect(() => {
    if (selected.dayKey && selected.dayKey !== dayKey) {
      setDayKey(selected.dayKey)
    }
    if (!selected.isNow) setScheduleExpanded(true)
  }, [selected.dayKey, selected.isNow, dayKey])

  const timeSlots = useMemo(
    () => buildHalfHourDeliverySlots(categories, dayKey),
    [categories, dayKey],
  )

  const onDayChanged = (day: DeliveryDayKey) => {
    setDayKey(day)
    setScheduleExpanded(true)
    onSelected(scheduledDaySelection(day))
  }

  const noticeText =
    notice ??
    (!allowDeliverNow
      ? kitchenName
        ? `Instant delivery is not available for ${kitchenName}. Please schedule a delivery slot.`
        : 'A kitchen in your cart only offers scheduled delivery — pick a day and time slot.'
      : null)

  if (loading) {
    return (
      <div className="ds-wrap">
        <p className="ds-loading">Loading delivery slots…</p>
      </div>
    )
  }

  return (
    <div className="ds-wrap">
      {noticeText && <p className="ds-notice">{noticeText}</p>}

      {allowDeliverNow && (
        <button
          type="button"
          className={`ds-now${selected.isNow ? ' is-selected' : ''}`}
          onClick={() => {
            setScheduleExpanded(false)
            onSelected(deliverySlotNow())
          }}
        >
          <span className="ds-now-icon" aria-hidden>
            <i className="bi bi-lightning-charge-fill" />
          </span>
          <span>
            <strong>Deliver now</strong>
            <small>As soon as the kitchen is ready</small>
          </span>
          <span className="ds-check" aria-hidden>
            <i className="bi bi-check-lg" />
          </span>
        </button>
      )}

      <div className={`ds-schedule${scheduleExpanded ? ' is-open' : ''}`}>
        <button
          type="button"
          className="ds-schedule-head"
          onClick={() => {
            const next = !scheduleExpanded
            setScheduleExpanded(next)
            if (next && selected.isNow) {
              const nextDay = firstDay ?? dayKey
              setDayKey(nextDay)
              onSelected(scheduledDaySelection(nextDay))
            }
          }}
        >
          <span className="ds-schedule-icon" aria-hidden>
            <i className="bi bi-calendar3" />
          </span>
          <span>
            <strong>Schedule delivery</strong>
            <small>
              {selected.isNow
                ? 'Pick a day and 30-minute slot'
                : selected.displayLabel}
            </small>
          </span>
          <i
            className={`bi bi-chevron-down ds-chevron${scheduleExpanded ? ' open' : ''}`}
            aria-hidden
          />
        </button>

        {scheduleExpanded && (
          <div className="ds-schedule-body">
            {availableDays.length === 0 ? (
              <p className="ds-empty">
                No delivery slots in the next 3 days. Try again later or choose
                different dishes.
              </p>
            ) : (
              <>
                <p className="ds-section-label">Choose day</p>
                <div className="ds-days" role="tablist" aria-label="Delivery day">
                  {availableDays.map((day) => (
                    <button
                      key={day.key}
                      type="button"
                      role="tab"
                      aria-selected={dayKey === day.key}
                      className={`ds-day${dayKey === day.key ? ' is-selected' : ''}`}
                      onClick={() => onDayChanged(day.key)}
                    >
                      <strong>{day.label}</strong>
                      <small>{deliveryDayShortDate(day.key)}</small>
                    </button>
                  ))}
                </div>

                <p className="ds-section-label">
                  Choose 30-min slot · {deliveryDayLabel(dayKey)}
                </p>
                {timeSlots.length === 0 ? (
                  <p className="ds-empty">
                    No slots left for {deliveryDayLabel(dayKey).toLowerCase()}.
                  </p>
                ) : (
                  <div className="ds-slots">
                    {timeSlots.map((slot) => {
                      const active =
                        !selected.isNow &&
                        selected.dayKey === dayKey &&
                        selected.superCategoryId === slot.superCategoryId &&
                        selected.timeStart === slot.timeStart &&
                        selected.timeEnd === slot.timeEnd
                      return (
                        <button
                          key={`${slot.superCategoryId}-${slot.timeStart}-${slot.timeEnd}`}
                          type="button"
                          className={`ds-slot${active ? ' is-selected' : ''}`}
                          onClick={() =>
                            onSelected(selectionForHalfHourSlot(dayKey, slot))
                          }
                        >
                          {slot.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
