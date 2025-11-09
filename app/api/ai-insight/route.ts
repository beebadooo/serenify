import { NextResponse } from "next/server"
import { createClient } from "@/supabase/server"

export async function POST() {
  try {
    const supabase = await createClient()

    // Get the current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ suggestion: "User not logged in." }, { status: 401 })
    }

    // Fetch last 7 days of mood data
    const { data: weekData, error } = await supabase
      .from("mood_checkins")
      .select("date, mood, energy, sleep, notes")
      .eq("user_id", user.id)
      .gte("date", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0])
      .order("date", { ascending: false })

    if (error) throw error
    if (!weekData || weekData.length === 0)
      return NextResponse.json({ suggestion: "No check-ins yet to analyze." })

    // Summarize week data
    const userSummary = weekData
      .map(
        (d: any) =>
          `${d.date}: Mood ${d.mood}/10, Energy ${d.energy}, Sleep ${d.sleep} hrs. Note: ${d.notes || "None"}`
      )
      .join("\n")

    // Send to Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `
You are a friendly wellness AI. Here’s a user's week summary:
${userSummary}

Analyze trends and give a warm, motivational reflection.
Include small, practical self-care suggestions (like walking, journaling, hydration).
Keep it short (4-5 sentences) and positive. Use 1–2 emojis.
`,
                },
              ],
            },
          ],
        }),
      }
    )

    const data = await response.json()

    const suggestion =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Couldn't generate insights right now. Try again later."

    return NextResponse.json({ suggestion })
  } catch (err) {
    console.error("AI route error:", err)
    return NextResponse.json(
      { suggestion: "⚠️ Something went wrong generating your AI insights." },
      { status: 500 }
    )
  }
}
