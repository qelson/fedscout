/**
 * One-time seed script — populates the opportunities table with the last
 * 30 days of SAM.gov data for common IT / professional-services NAICS codes.
 *
 * Usage:
 *   npx tsx scripts/seed-opportunities.ts
 *
 * Requires .env.local to be populated with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   SAM_GOV_API_KEY
 */

import { config } from 'dotenv'
import path from 'path'
import { createClient } from '@supabase/supabase-js'
import { fetchOpportunities, dateRangeFromDaysAgo, SamOpportunity } from '../lib/samgov'

config({ path: path.resolve(process.cwd(), '.env.local') })

const NAICS_CODES = [
  '541511', // Custom Computer Programming Services
  '541512', // Computer Systems Design Services
  '541513', // Computer Facilities Management Services
  '541519', // Other Computer Related Services
  '541611', // Admin Management & General Mgmt Consulting
  '561210', // Facilities Support Services
  '236220', // Commercial & Institutional Building Construction
]

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
    process.exit(1)
  }

  if (!process.env.SAM_GOV_API_KEY) {
    console.error('Missing SAM_GOV_API_KEY in .env.local')
    process.exit(1)
  }

  const supabase = createClient(supabaseUrl, serviceKey)
  const { postedFrom, postedTo } = dateRangeFromDaysAgo(30)

  console.log(`Seeding opportunities from ${postedFrom} to ${postedTo}`)
  console.log(`NAICS codes: ${NAICS_CODES.join(', ')}\n`)

  const allOpportunities: SamOpportunity[] = []
  const seen = new Set<string>()

  for (const naicsCode of NAICS_CODES) {
    process.stdout.write(`Fetching NAICS ${naicsCode}... `)

    try {
      const results = await fetchOpportunities({
        keywords: '',
        naicsCode,
        postedFrom,
        postedTo,
        limit: 100,
      })

      let newCount = 0
      for (const opp of results) {
        if (!seen.has(opp.sam_notice_id)) {
          seen.add(opp.sam_notice_id)
          allOpportunities.push(opp)
          newCount++
        }
      }

      console.log(`${results.length} fetched, ${newCount} unique`)
    } catch (err) {
      console.log(`ERROR: ${err instanceof Error ? err.message : err}`)
    }

    // Respect SAM.gov rate limits
    await new Promise((r) => setTimeout(r, 500))
  }

  if (allOpportunities.length === 0) {
    console.log('\nNo opportunities to insert.')
    return
  }

  console.log(`\nUpserting ${allOpportunities.length} unique opportunities into Supabase...`)

  // Upsert in batches of 100 to stay within Supabase payload limits
  const BATCH = 100
  let totalInserted = 0

  for (let i = 0; i < allOpportunities.length; i += BATCH) {
    const batch = allOpportunities.slice(i, i + BATCH)

    const { data, error } = await supabase
      .from('opportunities')
      .upsert(batch, { onConflict: 'sam_notice_id', ignoreDuplicates: false })
      .select('id')

    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH) + 1} error:`, error.message)
    } else {
      totalInserted += data?.length ?? 0
      process.stdout.write('.')
    }
  }

  console.log(`\n\nDone. ${totalInserted} rows upserted.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
