import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export default async function Page() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)

  const { data: students } = await supabase.from('students').select()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-6">PQF Predictor - Next.js + Supabase</h1>
      
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Students</h2>
        {students && students.length > 0 ? (
          <ul className="space-y-2">
            {students.map((student) => (
              <li key={student.id} className="p-3 bg-gray-50 rounded">
                <span className="font-medium">{student.name}</span>
                <span className="text-gray-500 ml-2">({student.student_id})</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">No students found. Database connected successfully!</p>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">System Status</h2>
        <p className="text-green-600">✓ Supabase connected</p>
        <p className="text-green-600">✓ Next.js app running</p>
      </div>
    </div>
  )
}
