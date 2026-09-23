import { getUserDashboardData } from '@/lib/getUserDashboardData';

export default async function Dashboard() {
  const userData = await getUserDashboardData()
  console.log(userData)

  return <div>oii</div>
}
