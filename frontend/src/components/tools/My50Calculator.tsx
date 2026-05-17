import { useState, useMemo } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Info } from 'lucide-react'
import type { My50FaresData } from '@/types/transport'

interface My50CalculatorProps {
  fares: My50FaresData
}

const MY50_PRICE = 50

export function My50Calculator({ fares }: My50CalculatorProps) {
  const [selectedService, setSelectedService] = useState(fares.average_fares[0]?.service_key ?? '')
  const [tripsPerWeek, setTripsPerWeek] = useState(10)

  const selectedFare = fares.average_fares.find(f => f.service_key === selectedService)

  const calc = useMemo(() => {
    if (!selectedFare) return null

    const typicalFare = selectedFare.typical_commute_myr
    // Each trip is one-way, return trip = 2 trips
    const monthlyTrips = (tripsPerWeek / 7) * 30
    const monthlyCost = monthlyTrips * typicalFare * 2 // return trip

    if (monthlyCost <= 0) return null

    const savings = monthlyCost - MY50_PRICE
    const breakEvenDay = Math.ceil(MY50_PRICE / ((monthlyCost / 30)))

    return {
      monthlyCost,
      savings,
      breakEvenDay,
      costPerTrip: typicalFare * 2,
      monthlyTrips,
      isBeneficial: savings > 0,
    }
  }, [selectedFare, tripsPerWeek])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>My50 Pass Calculator</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {fares.pass.name} — RM{fares.pass.price_myr} for {fares.pass.valid_days} days
            </p>
          </div>
          <Badge variant="default" className="shrink-0">RM50</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Service</label>
            <select
              value={selectedService}
              onChange={e => setSelectedService(e.target.value)}
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {fares.average_fares.map(fare => (
                <option key={fare.service_key} value={fare.service_key}>
                  {fare.service}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Trips per week: <span className="text-primary font-bold">{tripsPerWeek}</span>
            </label>
            <input
              type="range"
              min={1}
              max={14}
              value={tripsPerWeek}
              onChange={e => setTripsPerWeek(Number(e.target.value))}
              className="w-full h-2 rounded-full accent-primary cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>1</span>
              <span>14</span>
            </div>
          </div>
        </div>

        {/* Fare info */}
        {selectedFare && (
          <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
            <p>
              Fare range: <strong className="text-foreground">RM{selectedFare.min_fare_myr.toFixed(2)} – RM{selectedFare.max_fare_myr.toFixed(2)}</strong>
              {' · '}Typical commute: <strong className="text-foreground">RM{selectedFare.typical_commute_myr.toFixed(2)}</strong>
            </p>
            {selectedFare.note && <p className="mt-1 opacity-80">{selectedFare.note}</p>}
          </div>
        )}

        {/* Results */}
        {calc ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-xs text-muted-foreground mb-1">Monthly cost (no pass)</p>
              <p className="text-xl font-bold text-foreground">RM{calc.monthlyCost.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {calc.monthlyTrips.toFixed(0)} trips × RM{calc.costPerTrip.toFixed(2)}
              </p>
            </div>

            <div className={`p-4 rounded-lg border ${calc.isBeneficial ? 'border-green-500/30 bg-green-500/10' : 'border-red-500/30 bg-red-500/10'}`}>
              <p className="text-xs text-muted-foreground mb-1">Savings with My50</p>
              <p className={`text-xl font-bold ${calc.isBeneficial ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                {calc.savings >= 0 ? '+' : ''}RM{calc.savings.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {calc.isBeneficial ? 'Pass is worth it' : 'Pass may not be worth it'}
              </p>
            </div>

            <div className="p-4 rounded-lg border border-border bg-card">
              <p className="text-xs text-muted-foreground mb-1">Break-even day</p>
              <p className="text-xl font-bold text-foreground">Day {calc.breakEvenDay}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                of a 30-day month
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground text-sm">
            Select a service to calculate savings
          </div>
        )}

        {/* Covered services */}
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1.5">Covered services</p>
          <div className="flex flex-wrap gap-1.5">
            {fares.pass.covered_services.map(s => (
              <Badge key={s} variant="success" className="text-[10px]">{s}</Badge>
            ))}
          </div>
          {fares.pass.not_covered.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-1">Not covered</p>
              <div className="flex flex-wrap gap-1.5">
                {fares.pass.not_covered.map(s => (
                  <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
          <Info size={13} className="shrink-0 mt-0.5" />
          <p>{fares.calculator_note}</p>
        </div>
      </CardContent>
    </Card>
  )
}
