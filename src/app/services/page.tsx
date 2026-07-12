import { redirect } from 'next/navigation'

// The wider services offering (transfers, tours, real estate) is not live yet, so
// it is removed from the public site. Backend Service/TripGoal models stay intact
// for admin/CRM use. Any old /services link now lands on the car catalogue.
export default function ServicesPage() {
  redirect('/catalog')
}
