"use client"

import { useEffect, useState } from "react"
import { AppLayout } from "@/components/app-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, Calendar, Award } from "lucide-react"
import { useSupabaseClient } from "@/lib/supabase/use-supabase"
import { useRouter } from "next/navigation"

// We'll replace this with dynamic data from the database
const emptyMoodData = [
  { day: "Mon", mood: 0, sleep: 0 },
  { day: "Tue", mood: 0, sleep: 0 },
  { day: "Wed", mood: 0, sleep: 0 },
  { day: "Thu", mood: 0, sleep: 0 },
  { day: "Fri", mood: 0, sleep: 0 },
  { day: "Sat", mood: 0, sleep: 0 },
  { day: "Sun", mood: 0, sleep: 0 },
]

interface HabitCompletionData {
  name: string;
  value: number;
  category: string;
}

const colors = ["#9ec5ab", "#32746d", "#104f55", "#7ab89f"]

const quotes = [
  "The greatest glory in living lies not in never falling, but in rising every time we fall.",
  "Your wellness journey is unique – celebrate every small victory.",
  "Peace comes from within. Do not seek it without.",
  "Take care of your body. It's the only place you have to live.",
  "Happiness is not by chance, but by choice.",
  "You are braver than you believe, stronger than you seem, and smarter than you think.",
  "The only way to do great work is to love what you do.",
  "Self-care is not selfish. You cannot serve from an empty vessel.",
  "Progress, not perfection, is the goal.",
  "Your mental health is a priority, not a luxury.",
  "Be kind to yourself. You're doing the best you can.",
  "Healing doesn't mean the damage never existed. It means the damage no longer controls our lives.",
]

interface MoodData {
  day: string;
  mood: number;
  sleep: number;
}

interface WeeklyStats {
  avgMood: number;
  avgSleep: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [moodData, setMoodData] = useState<MoodData[]>(emptyMoodData)
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({ avgMood: 0, avgSleep: 0 })
  const [habitData, setHabitData] = useState<HabitCompletionData[]>([])
  const [totalHabitsCompleted, setTotalHabitsCompleted] = useState(0)
  const router = useRouter()
  const supabase = useSupabaseClient()

  const getStartOfWeek = () => {
    const startOfWeek = new Date()
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()) // Get Sunday
    startOfWeek.setHours(0, 0, 0, 0)
    return startOfWeek
  }

  const fetchHabitData = async () => {
    try {
      const startOfWeek = getStartOfWeek()
      // Ensure we have an authenticated user (don't rely on `user` state which may not be set yet)
      const { data: { user: currentUser } = {}, error: userErr } = await supabase.auth.getUser()
      if (userErr || !currentUser) {
        console.warn('[dashboard] fetchHabitData: no authenticated user, skipping habit fetch', userErr)
        return
      }

      // First, get all habits for the current user
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('id, name, category')
        .eq('user_id', currentUser.id)

      if (habitsError) throw habitsError

      if (!habits) return

      // Then, get completions for this week
      const { data: completions, error: completionsError } = await supabase
        .from('habit_completions')
        .select('habit_id, completed_date')
        .eq('user_id', currentUser.id)
        .gte('completed_date', startOfWeek.toISOString().split('T')[0])

      if (completionsError) throw completionsError

      // Calculate completion rates
      const completionData = habits.map((habit: { id: any; name: any; category: any }) => {
        const habitCompletions = completions?.filter((c: { habit_id: any }) => c.habit_id === habit.id) || []
        const completionRate = Math.round((habitCompletions.length / 7) * 100)
        
        return {
          name: habit.name,
          value: completionRate,
          category: habit.category
        }
      })

      setHabitData(completionData)
      setTotalHabitsCompleted(completions?.length || 0)
    } catch (err) {
      // Log more details to help debugging
      console.error('Error fetching habit data:', err, err && (err instanceof Error ? err.message : JSON.stringify(err)))
    }
  }

  const fetchMoodData = async () => {
    try {
      const startOfWeek = getStartOfWeek()

      const { data, error } = await supabase
        .from('moods')
        .select('*')
        .gte('created_at', startOfWeek.toISOString())
        .order('created_at', { ascending: true })

      if (error) throw error

      // Process the data into daily format
      const processedData = [...emptyMoodData]
      let totalMood = 0
      let totalSleep = 0
      let entriesCount = 0

      if (data) {
        data.forEach((entry: { created_at: string | number | Date; mood_score: number; sleep_hours: any }) => {
          const date = new Date(entry.created_at)
          const dayIndex = date.getDay()
          const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayIndex]
          
          // Scale mood_score from 1-5 to 1-10 for visualization
          const scaledMood = (entry.mood_score * 2)
          
          processedData[dayIndex] = {
            day: dayName,
            mood: scaledMood,
            sleep: entry.sleep_hours || 0
          }

          totalMood += scaledMood
          totalSleep += entry.sleep_hours || 0
          entriesCount++
        })

        // Calculate averages
        setWeeklyStats({
          avgMood: entriesCount ? +(totalMood / entriesCount).toFixed(1) : 0,
          avgSleep: entriesCount ? +(totalSleep / entriesCount).toFixed(1) : 0
        })
      }

      setMoodData(processedData)
    } catch (err) {
      console.error('Error fetching mood data:', err)
    }
  }

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user: currentUser },
        } = await supabase.auth.getUser()

        if (!currentUser) {
          router.push("/login")
          return
        }

        setUser(currentUser)
        // Fetch both mood and habit data after authentication
        await Promise.all([
          fetchMoodData(),
          fetchHabitData()
        ])
      } catch (error) {
        console.error("[v0] Auth check error:", error)
        router.push("/login")
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [supabase, router])

  // Refresh data when changes are made in the tracker or habits
  useEffect(() => {
    const moodsSubscription = supabase
      .channel('dashboard-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'moods' },
        () => {
          fetchMoodData()
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'habit_completions' },
        () => {
          fetchHabitData()
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'habits' },
        () => {
          fetchHabitData()
        }
      )
      .subscribe()

    return () => {
      moodsSubscription.unsubscribe()
    }
  }, [user?.id])

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)]

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-foreground/70">Loading...</p>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Your Wellness Dashboard</h1>
            <p className="text-foreground/70">Track your progress and insights</p>
          </div>
          <button className="px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg font-medium transition-colors">
            This Week
          </button>
        </div>

        {/* Key Stats */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-foreground/70 text-sm font-medium">Current Streak</p>
                  <p className="text-3xl font-bold text-accent mt-2">12</p>
                  <p className="text-xs text-foreground/60 mt-1">consecutive days</p>
                </div>
                <Award className="w-8 h-8 text-accent/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-foreground/70 text-sm font-medium">Weekly Avg Mood</p>
                  <p className="text-3xl font-bold text-accent mt-2">{weeklyStats.avgMood}</p>
                  <p className="text-xs text-foreground/60 mt-1">out of 10</p>
                </div>
                <TrendingUp className="w-8 h-8 text-accent/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-foreground/70 text-sm font-medium">Habits Completed</p>
                  <p className="text-3xl font-bold text-accent mt-2">{totalHabitsCompleted}</p>
                  <p className="text-xs text-foreground/60 mt-1">this week</p>
                </div>
                <Calendar className="w-8 h-8 text-accent/50" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-foreground/70 text-sm font-medium">Avg Sleep</p>
                  <p className="text-3xl font-bold text-accent mt-2">{weeklyStats.avgSleep}</p>
                  <p className="text-xs text-foreground/60 mt-1">hours per night</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                  <span className="text-sm text-accent">ZZZ</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Mood & Sleep Trend */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Weekly Mood & Sleep Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={moodData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="day" stroke="var(--foreground)" />
                  <YAxis stroke="var(--foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "var(--foreground)" }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="mood" stroke="var(--accent)" strokeWidth={2} />
                  <Line type="monotone" dataKey="sleep" stroke="var(--secondary)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
              <div className="mt-6 p-4 bg-accent/10 rounded-lg border border-accent/20">
                <p className="text-sm text-foreground/80 italic">"{randomQuote}"</p>
              </div>
            </CardContent>
          </Card>

          {/* Habit Completion Rate */}
          <Card className="bg-card/50 border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Habit Completion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={habitData as any[]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={100}
                    fill="#9ec5ab"
                    dataKey="value"
                  >
                    {habitData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "var(--card)",
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "var(--foreground)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-card/50 border-border/50">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { activity: "Completed meditation", time: "2 hours ago", icon: "🧘" },
                { activity: "Logged mood: 8/10", time: "4 hours ago", icon: "😊" },
                { activity: "Completed exercise", time: "1 day ago", icon: "🏃" },
                { activity: "Started journaling habit", time: "2 days ago", icon: "📝" },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="text-lg">{item.icon}</div>
                    <div>
                      <p className="text-foreground font-medium text-sm">{item.activity}</p>
                      <p className="text-foreground/60 text-xs">{item.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
