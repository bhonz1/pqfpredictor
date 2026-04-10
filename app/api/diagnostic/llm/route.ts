import { NextResponse } from 'next/server';

export async function GET() {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  
  const diagnostics = {
    timestamp: new Date().toISOString(),
    credentials: {
      hasAccountId: !!accountId,
      hasApiToken: !!apiToken,
      accountIdPreview: accountId ? `${accountId.substring(0, 8)}...` : null,
    },
    tests: [] as any[],
    overall: 'pending' as string
  };

  // Test 1: Check credentials exist
  if (!accountId || !apiToken) {
    diagnostics.tests.push({
      name: 'Credentials Check',
      status: 'fail',
      message: 'Missing CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN'
    });
    diagnostics.overall = 'failed';
    return NextResponse.json(diagnostics, { status: 500 });
  }

  diagnostics.tests.push({
    name: 'Credentials Check',
    status: 'pass',
    message: 'Environment variables are set'
  });

  // Test 2: Try to call Cloudflare AI with a simple prompt
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: 'Respond with ONLY: {"status": "ok"}'
            },
            {
              role: 'user',
              content: 'Test'
            }
          ],
          max_tokens: 50,
          temperature: 0.1
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      diagnostics.tests.push({
        name: 'Cloudflare AI API Call',
        status: 'fail',
        message: `HTTP ${response.status}: ${errorText.substring(0, 200)}`
      });
      diagnostics.overall = 'failed';
      return NextResponse.json(diagnostics, { status: 502 });
    }

    const data = await response.json();
    
    if (!data.result?.response) {
      diagnostics.tests.push({
        name: 'Cloudflare AI API Call',
        status: 'fail',
        message: 'Invalid response structure from Cloudflare AI'
      });
      diagnostics.overall = 'failed';
      return NextResponse.json(diagnostics, { status: 502 });
    }

    diagnostics.tests.push({
      name: 'Cloudflare AI API Call',
      status: 'pass',
      message: 'Successfully connected to Cloudflare Workers AI',
      responsePreview: data.result.response.substring(0, 100)
    });

    // Test 3: Validate JSON parsing
    try {
      const output = data.result.response;
      const jsonMatch = output.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        JSON.parse(jsonMatch[0]);
        diagnostics.tests.push({
          name: 'JSON Parsing',
          status: 'pass',
          message: 'Successfully parsed JSON response'
        });
      } else {
        diagnostics.tests.push({
          name: 'JSON Parsing',
          status: 'warn',
          message: 'No JSON object found in response, but response received'
        });
      }
    } catch (parseError: any) {
      diagnostics.tests.push({
        name: 'JSON Parsing',
        status: 'warn',
        message: `JSON parsing issue: ${parseError.message}`
      });
    }

    diagnostics.overall = 'healthy';
    return NextResponse.json(diagnostics);

  } catch (error: any) {
    diagnostics.tests.push({
      name: 'Cloudflare AI API Call',
      status: 'fail',
      message: error.name === 'AbortError' 
        ? 'Request timed out after 15 seconds' 
        : error.message
    });
    diagnostics.overall = 'failed';
    return NextResponse.json(diagnostics, { status: 502 });
  }
}
