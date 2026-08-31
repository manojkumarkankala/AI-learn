Deno.serve(async (req: Request) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const {
      analysisId,
      noteContent,
      noteTitle,
      numQuestions,
      difficulty,
      courseId,
      lessonId,
    } = await req.json();

    if (!noteContent || noteContent.trim().length < 50) {
      return new Response(
        JSON.stringify({ error: "Insufficient source material to generate reliable questions." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "AI service is not configured. Please contact the administrator." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const truncatedContent = noteContent.slice(0, 12000);

    const prompt = `You are an expert exam question generator. Based ONLY on the following study material, generate ${numQuestions} exam questions.

Study material title: ${noteTitle}
Study material content:
${truncatedContent}

Rules:
1. Generate questions ONLY from the provided material. Do NOT introduce unrelated information.
2. Each question must have exactly one correct answer for MCQ and True/False.
3. Include plausible but clearly wrong distractors.
4. Include a clear explanation for each question.
5. Assign a difficulty (Easy, Medium, or Hard) based on the complexity.
6. Assign a topic based on the content.
7. If the material is insufficient for the requested number of questions, generate fewer rather than inventing content.
8. Avoid duplicate questions.

Difficulty preference: ${difficulty}

Return a JSON array of question objects with this exact structure:
[
  {
    "question": "The question text",
    "question_type": "multiple_choice",
    "options": [
      {"text": "Option A", "is_correct": false},
      {"text": "Option B", "is_correct": true},
      {"text": "Option C", "is_correct": false},
      {"text": "Option D", "is_correct": false}
    ],
    "correct_answer": "Option B",
    "explanation": "Why this answer is correct",
    "difficulty": "Easy",
    "topic": "Topic name from the material"
  }
]

Use "multiple_choice", "true_false", or "short_answer" as question_type. For true_false, use two options. For short_answer, use an empty options array and put the answer in correct_answer.

Return ONLY the JSON array, no other text.`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      console.error("Gemini API error:", geminiResponse.status, await geminiResponse.text());
      return new Response(
        JSON.stringify({ error: "AI generation could not be completed. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiResponse.json();
    const generatedText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      return new Response(
        JSON.stringify({ error: "AI did not generate any questions. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let questions: Array<Record<string, unknown>> = [];
    try {
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
      const jsonStr = jsonMatch ? jsonMatch[0] : generatedText;
      questions = JSON.parse(jsonStr);
    } catch {
      return new Response(
        JSON.stringify({ error: "AI generated an invalid response. Please try again." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return new Response(
        JSON.stringify({ error: "No questions were generated from this material." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const savedQuestions: Array<Record<string, unknown>> = [];
    for (const q of questions) {
      const { data, error } = await fetch(`${supabaseUrl}/rest/v1/ai_generated_questions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({
          analysis_id: analysisId,
          course_id: courseId || null,
          lesson_id: lessonId || null,
          question: q.question,
          question_type: q.question_type || "multiple_choice",
          options: q.options || [],
          correct_answer: q.correct_answer || "",
          explanation: q.explanation || "",
          difficulty: q.difficulty || "Easy",
          topic: q.topic || "",
          source_reference: noteTitle,
          status: "generated",
        }),
      }).then((r) => r.json()).then((d) => d).catch(() => null);

      if (data && !error) savedQuestions.push(data);
    }

    return new Response(
      JSON.stringify({ questions: savedQuestions, count: savedQuestions.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
