import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createSeed } from '@/api/seed'
import type { Shipment } from '@/api/types'
import { Journey } from '@/components/journey/Journey'
import { renderWithProviders } from '@/test/renderWithProviders'

const NOW = new Date('2026-10-20T10:00:00.000Z')
const LATER = new Date('2027-01-01T10:00:00.000Z')
const CARRIER_NAMES = {
  'transauto': 'Transauto',
  'mareline': 'Mareline',
  'euroruta': 'EuroRuta',
  'vascor-trans': 'Vascor Trans',
  'nordsee-line': 'Nordsee Line',
}

function getSeedShipment(shipmentId: string): Shipment {
  const shipment = createSeed().shipments.find(candidate => candidate.id === shipmentId)
  if (!shipment) {
    throw new Error(`Seed shipment ${shipmentId} not found`)
  }
  return shipment
}

function getStep(place: string): HTMLElement {
  const items = within(screen.getByRole('list', { name: 'Shipment journey' })).getAllByRole('listitem')
  const match = items.find(item => within(item).queryByText(place) !== null)
  if (!match) {
    throw new Error(`Step ${place} not found`)
  }
  return match
}

describe('Journey', () => {
  describe('structure', () => {
    it('renders the Journey heading and an ordered list with one item per step', () => {
      const shipment = getSeedShipment('SH-1042')

      renderWithProviders(<Journey carrierNames={CARRIER_NAMES} now={NOW} shipment={shipment} />)

      expect(screen.getByRole('heading', { name: 'Journey' })).toBeInTheDocument()
      const items = within(screen.getByRole('list', { name: 'Shipment journey' })).getAllByRole('listitem')
      expect(items).toHaveLength(4)
      expect(items[0]).toHaveTextContent('Zaragoza plant')
      expect(items[1]).toHaveTextContent('Bilbao port')
      expect(items[2]).toHaveTextContent('Southampton port')
      expect(items[3]).toHaveTextContent('Birmingham')
    })

    it('labels each connector with the leg mode and carrier name', () => {
      const shipment = getSeedShipment('SH-1042')

      renderWithProviders(<Journey carrierNames={CARRIER_NAMES} now={NOW} shipment={shipment} />)

      expect(screen.getAllByText('Road · Transauto')).toHaveLength(2)
      expect(screen.getByText('Sea · Nordsee Line')).toBeInTheDocument()
    })

    it('falls back to the carrier id when the carrier name is unknown', () => {
      const shipment = getSeedShipment('SH-1033')

      renderWithProviders(<Journey carrierNames={{}} now={NOW} shipment={shipment} />)

      expect(screen.getAllByText('Road · euroruta')).toHaveLength(2)
    })
  })

  describe('provenance labels', () => {
    it('shows no provenance label on past carrier milestones', () => {
      const shipment = getSeedShipment('SH-1033')

      renderWithProviders(<Journey carrierNames={CARRIER_NAMES} now={NOW} shipment={shipment} />)

      const pickedUpStep = getStep('Zaragoza plant')
      const inTransitStep = getStep('A-9 near Nîmes')
      expect(pickedUpStep).toHaveTextContent('Picked up · Oct 19')
      expect(pickedUpStep).not.toHaveTextContent(/Estimated|Carrier ETA|Derived/)
      expect(inTransitStep).toHaveTextContent('In transit')
      expect(inTransitStep).not.toHaveTextContent(/Estimated|Carrier ETA|Derived/)
    })

    it('shows the carrier ETA badge on the final step when the estimate is in line', () => {
      const shipment = getSeedShipment('SH-1033')

      renderWithProviders(<Journey carrierNames={CARRIER_NAMES} now={NOW} shipment={shipment} />)

      const finalStep = getStep('Basel')
      expect(within(finalStep).getByText('Carrier ETA')).toBeInTheDocument()
      expect(finalStep).toHaveTextContent('Delivery ~ Oct 21')
    })

    it('shows our estimate with its confidence on the final step when it deviates from the carrier ETA', () => {
      const shipment = getSeedShipment('SH-1042')

      renderWithProviders(<Journey carrierNames={CARRIER_NAMES} now={NOW} shipment={shipment} />)

      const finalStep = getStep('Birmingham')
      expect(within(finalStep).getByText('Estimated · 81%')).toBeInTheDocument()
      expect(within(finalStep).queryByText('Carrier ETA')).not.toBeInTheDocument()
    })

    it('shows our estimate with its confidence on the final step when the carrier gave no ETA', () => {
      const shipment = getSeedShipment('SH-1044')

      renderWithProviders(<Journey carrierNames={CARRIER_NAMES} now={NOW} shipment={shipment} />)

      const finalStep = getStep('Madrid')
      expect(within(finalStep).getByText('Estimated · 70%')).toBeInTheDocument()
    })

    it('shows Estimated without a percentage on an intermediate future step', () => {
      const shipment = getSeedShipment('SH-1047')

      renderWithProviders(<Journey carrierNames={CARRIER_NAMES} now={NOW} shipment={shipment} />)

      const intermediateStep = getStep('Genoa port')
      expect(within(intermediateStep).getByText('Estimated')).toBeInTheDocument()
      expect(intermediateStep).not.toHaveTextContent('%')
      expect(intermediateStep).toHaveTextContent('Arrival ~ Oct 21')
    })

    it('shows the derived from GPS badge on a step derived by the system', () => {
      const shipment = getSeedShipment('SH-1037')

      renderWithProviders(<Journey carrierNames={CARRIER_NAMES} now={NOW} shipment={shipment} />)

      expect(within(getStep('Basel border crossing')).getByText('Derived from GPS')).toBeInTheDocument()
    })

    it('shows the overdue date instead of the planned one when the planned date has passed', () => {
      const shipment = getSeedShipment('SH-1047')

      renderWithProviders(<Journey carrierNames={CARRIER_NAMES} now={LATER} shipment={shipment} />)

      const intermediateStep = getStep('Genoa port')
      expect(intermediateStep).toHaveTextContent('Overdue since Oct 21')
      expect(intermediateStep).not.toHaveTextContent('Arrival ~')
    })

    it('does not show the overdue text while the planned date is still ahead', () => {
      const shipment = getSeedShipment('SH-1047')

      renderWithProviders(<Journey carrierNames={CARRIER_NAMES} now={NOW} shipment={shipment} />)

      expect(screen.queryByText(/Overdue since/)).not.toBeInTheDocument()
    })
  })

  describe('step states for screen readers', () => {
    it('announces the customs hold step as needing attention', () => {
      const shipment = getSeedShipment('SH-1042')

      renderWithProviders(<Journey carrierNames={CARRIER_NAMES} now={NOW} shipment={shipment} />)

      const problemStep = getStep('Southampton port')
      expect(within(problemStep).getByText('Needs attention')).toBeInTheDocument()
      expect(problemStep).toHaveTextContent('Customs hold')
      expect(screen.getAllByText('Needs attention')).toHaveLength(1)
    })

    it('announces reached steps as completed and future steps as upcoming', () => {
      const shipment = getSeedShipment('SH-1042')

      renderWithProviders(<Journey carrierNames={CARRIER_NAMES} now={NOW} shipment={shipment} />)

      expect(within(getStep('Zaragoza plant')).getByText('Completed')).toBeInTheDocument()
      expect(within(getStep('Bilbao port')).getByText('Completed')).toBeInTheDocument()
      expect(within(getStep('Birmingham')).getByText('Upcoming')).toBeInTheDocument()
    })

    it('marks every step as completed and shows no ETA badge on a delivered shipment', () => {
      const shipment = getSeedShipment('SH-1009')

      renderWithProviders(<Journey carrierNames={CARRIER_NAMES} now={NOW} shipment={shipment} />)

      expect(screen.getAllByText('Completed')).toHaveLength(2)
      expect(screen.queryByText('Upcoming')).not.toBeInTheDocument()
      expect(screen.queryByText('Needs attention')).not.toBeInTheDocument()
      expect(screen.queryByText(/Estimated|Carrier ETA/)).not.toBeInTheDocument()
      expect(getStep('Nordwerk GmbH, Hamburg')).toHaveTextContent('Delivered')
    })
  })

  describe('without onStepSelect', () => {
    it('renders no buttons and no hint', () => {
      const shipment = getSeedShipment('SH-1042')

      renderWithProviders(<Journey carrierNames={CARRIER_NAMES} now={NOW} shipment={shipment} />)

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
      expect(screen.queryByText(/to see its source events/)).not.toBeInTheDocument()
    })
  })

  describe('with onStepSelect', () => {
    it('shows the hint about source events', () => {
      const shipment = getSeedShipment('SH-1042')

      renderWithProviders(<Journey carrierNames={CARRIER_NAMES} now={NOW} shipment={shipment} onStepSelect={vi.fn()} />)

      expect(screen.getByText('Click a step to see its source events')).toBeInTheDocument()
      expect(screen.getByText('Tap a step to see its source events')).toBeInTheDocument()
    })

    it('renders a button for each step with source events and none for future steps', () => {
      const shipment = getSeedShipment('SH-1042')

      renderWithProviders(<Journey carrierNames={CARRIER_NAMES} now={NOW} shipment={shipment} onStepSelect={vi.fn()} />)

      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(3)
      expect(buttons[0]).toHaveTextContent('Zaragoza plant')
      expect(buttons[1]).toHaveTextContent('Bilbao port')
      expect(buttons[2]).toHaveTextContent('Southampton port')
      expect(within(getStep('Birmingham')).queryByRole('button')).not.toBeInTheDocument()
    })

    it('does not render a button for a derived step without source events', () => {
      const shipment = getSeedShipment('SH-1037')

      renderWithProviders(<Journey carrierNames={CARRIER_NAMES} now={NOW} shipment={shipment} onStepSelect={vi.fn()} />)

      expect(screen.getAllByRole('button')).toHaveLength(1)
      expect(within(getStep('Basel border crossing')).queryByRole('button')).not.toBeInTheDocument()
    })

    it('calls onStepSelect with the step when its button is clicked', async () => {
      const user = userEvent.setup()
      const onStepSelect = vi.fn()
      const shipment = getSeedShipment('SH-1042')
      renderWithProviders(<Journey carrierNames={CARRIER_NAMES} now={NOW} shipment={shipment} onStepSelect={onStepSelect} />)

      await user.click(within(getStep('Southampton port')).getByRole('button'))

      expect(onStepSelect).toHaveBeenCalledTimes(1)
      expect(onStepSelect).toHaveBeenCalledWith(expect.objectContaining({
        id: 'step-2',
        place: 'Southampton port',
        rawEventIds: ['SH-1042-E5', 'SH-1042-E6'],
      }))
    })

    it('reaches the step buttons with Tab and selects the focused one with Enter', async () => {
      const user = userEvent.setup()
      const onStepSelect = vi.fn()
      const shipment = getSeedShipment('SH-1042')
      renderWithProviders(<Journey carrierNames={CARRIER_NAMES} now={NOW} shipment={shipment} onStepSelect={onStepSelect} />)

      await user.tab()
      await user.tab()
      await user.keyboard('{Enter}')

      expect(within(getStep('Bilbao port')).getByRole('button')).toHaveFocus()
      expect(onStepSelect).toHaveBeenCalledTimes(1)
      expect(onStepSelect).toHaveBeenCalledWith(expect.objectContaining({
        id: 'step-1',
        place: 'Bilbao port',
        rawEventIds: ['SH-1042-E2', 'SH-1042-E3', 'SH-1042-E4'],
      }))
    })
  })
})
