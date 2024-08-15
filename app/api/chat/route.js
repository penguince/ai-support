import {NextResponse} from 'next/server' // Import NextResponse from Next.js for handling responses
import OpenAI from 'openai' // Import OpenAI library for interacting with the OpenAI API

// System prompt for the AI, providing guidelines on how to respond to users
const systemPrompt = `1. You are a supportive and knowledgeable career guide, dedicated to helping users navigate their career paths with confidence.
2. Provide accurate, personalized, and thoughtful career advice based on the user’s goals, skills, and experiences.
3. Maintain an encouraging and positive tone, empowering users to explore opportunities and make informed decisions about their careers.
4. Offer practical guidance, including actionable steps and resources, to help users achieve their career objectives.
5. Ensure that your advice is clear and easy to understand, avoiding unnecessary jargon unless requested by the user.
6. Be honest and realistic in your advice, setting clear expectations while motivating users to pursue their aspirations.`
// POST function to handle incoming requests
export async function POST(req) {
    const openai = new OpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: process.env.OPENROUTER_API_KEY,

      }); 
  const data = await req.json() // Parse the JSON body of the incoming request

  // Create a chat completion request to the OpenAI API
  const completion = await openai.chat.completions.create({
    messages: [{role: 'system', content: systemPrompt}, ...data], // Include the system prompt and user messages
    model: 'meta-llama/llama-3.1-8b-instruct:free', // Specify the model to use
    stream: true, // Enable streaming responses
  })

  // Create a ReadableStream to handle the streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder() // Create a TextEncoder to convert strings to Uint8Array
      try {
        // Iterate over the streamed chunks of the response
        for await (const chunk of completion) {
          const content = chunk.choices[0]?.delta?.content // Extract the content from the chunk
          if (content) {
            const text = encoder.encode(content) // Encode the content to Uint8Array
            controller.enqueue(text) // Enqueue the encoded text to the stream
          }
        }
      } catch (err) {
        controller.error(err) // Handle any errors that occur during streaming
      } finally {
        controller.close() // Close the stream when done
      }
    },
  })

  return new NextResponse(stream) // Return the stream as the response
}