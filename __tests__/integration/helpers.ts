/* eslint-disable @n8n/community-nodes/no-restricted-imports, @n8n/community-nodes/no-restricted-globals */
import 'dotenv/config';
import type { IDataObject, INode } from 'n8n-workflow';

const mockNode: INode = {
	id: 'integration-test-node',
	name: 'Notte',
	type: 'n8n-nodes-notte.notte',
	typeVersion: 1,
	position: [0, 0],
	parameters: {},
};

function getApiKey(): string {
	const key = process.env.NOTTE_API_KEY;
	if (!key) {
		throw new Error('NOTTE_API_KEY is not set — cannot run integration tests');
	}
	return key;
}

type TestHttpRequestOptions = {
	method: string;
	url: string;
	headers?: Record<string, string>;
	body?: unknown;
	qs?: Record<string, string | number | boolean>;
	json?: boolean;
	returnFullResponse?: boolean;
	disableFollowRedirect?: boolean;
	ignoreHttpStatusErrors?: boolean;
};

export function createRealExecuteFunctions(overrides: {
	nodeParameters?: Record<string, unknown>;
} = {}) {
	const nodeParameters = overrides.nodeParameters ?? {};
	const apiKey = getApiKey();

	const credentials: IDataObject = {
		apiKey,
		baseUrl: 'https://api.notte.cc',
	};

	const context = {
		getNodeParameter: jest.fn((name: string, _index: number, fallback?: unknown) => {
			if (name in nodeParameters) {
				return nodeParameters[name];
			}
			return fallback;
		}),
		getCredentials: jest.fn().mockResolvedValue(credentials),
		getNode: jest.fn().mockReturnValue(mockNode),
		getInputData: jest.fn().mockReturnValue([{ json: {} }]),
		continueOnFail: jest.fn().mockReturnValue(false),
		helpers: {
			httpRequest: async (options: TestHttpRequestOptions) => {
				const url = new URL(options.url);
				if (options.qs) {
					for (const [key, value] of Object.entries(options.qs)) {
						url.searchParams.set(key, String(value));
					}
				}

				const response = await fetch(url.toString(), {
					method: options.method,
					headers: options.headers,
					body: options.body ? JSON.stringify(options.body) : undefined,
					redirect: options.disableFollowRedirect ? 'manual' : 'follow',
				});

				const contentType = response.headers.get('content-type') ?? '';
				const rawBody = await response.text();
				let body: unknown = rawBody;

				if (options.json || contentType.includes('application/json')) {
					try {
						body = rawBody ? JSON.parse(rawBody) : null;
					} catch {
						body = rawBody;
					}
				}

				if (options.returnFullResponse) {
					return {
						statusCode: response.status,
						headers: Object.fromEntries(response.headers.entries()),
						body,
					};
				}

				if (!response.ok && !options.ignoreHttpStatusErrors) {
					throw {
						message: `HTTP ${response.status}: ${typeof body === 'string' ? body : JSON.stringify(body)}`,
						response: { data: body },
					};
				}

				return body;
			},
		},
	};

	return { context };
}
