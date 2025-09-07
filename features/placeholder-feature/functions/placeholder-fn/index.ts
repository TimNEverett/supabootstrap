import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Parse request body
    const { action, data } = await req.json()

    let result

    switch (action) {
      case 'create':
        // Create a new placeholder item
        const { data: createData, error: createError } = await supabaseClient
          .from('placeholder_items')
          .insert([{
            name: data.name,
            description: data.description
          }])
          .select()

        if (createError) {
          throw createError
        }

        result = { success: true, data: createData }
        break

      case 'list':
        // List all placeholder items
        const { data: listData, error: listError } = await supabaseClient
          .from('placeholder_items')
          .select('*')
          .order('created_at', { ascending: false })

        if (listError) {
          throw listError
        }

        result = { success: true, data: listData }
        break

      case 'get':
        // Get a specific placeholder item
        const { data: getData, error: getError } = await supabaseClient
          .from('placeholder_items')
          .select('*')
          .eq('id', data.id)
          .single()

        if (getError) {
          throw getError
        }

        result = { success: true, data: getData }
        break

      case 'update':
        // Update a placeholder item
        const { data: updateData, error: updateError } = await supabaseClient
          .from('placeholder_items')
          .update({
            name: data.name,
            description: data.description
          })
          .eq('id', data.id)
          .select()

        if (updateError) {
          throw updateError
        }

        result = { success: true, data: updateData }
        break

      case 'delete':
        // Delete a placeholder item
        const { error: deleteError } = await supabaseClient
          .from('placeholder_items')
          .delete()
          .eq('id', data.id)

        if (deleteError) {
          throw deleteError
        }

        result = { success: true, message: 'Item deleted successfully' }
        break

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})