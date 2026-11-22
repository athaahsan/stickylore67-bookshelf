export const config = { path: '/api/visitor-country' }

export default function visitorCountry(_request, context) {
  const code = context.geo?.country?.code
  return Response.json({ countryCode: /^[A-Z]{2}$/.test(code ?? '') ? code : null }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
