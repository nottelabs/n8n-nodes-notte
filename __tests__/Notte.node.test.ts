import { Notte } from '../nodes/Notte/Notte.node';
import { createMockExecuteFunctions } from './helpers';

// Mock n8n-workflow's sleep
jest.mock('n8n-workflow', () => {
	const actual = jest.requireActual('n8n-workflow');
	return {
		...actual,
		sleep: jest.fn().mockResolvedValue(undefined),
	};
});

describe('Notte Node', () => {
		describe('description', () => {
			it('has correct metadata', () => {
				const node = new Notte();
				expect(node.description.displayName).toBe('Notte Agent Browser');
				expect(node.description.name).toBe('notte');
				expect(node.description.usableAsTool).toBe(true);
			});
		});

	describe('Agent mode', () => {
		it('creates session, starts agent, polls, and returns result', async () => {
			const { context, mockHttpRequestWithAuthentication } = createMockExecuteFunctions({
				nodeParameters: {
					mode: 'agent',
					task: 'Extract pricing info',
					url: 'https://example.com',
					agentOptions: { headless: true },
				},
			});

			// Session start
			mockHttpRequestWithAuthentication.mockResolvedValueOnce({ session_id: 'ses_123' });
			// Agent start
			mockHttpRequestWithAuthentication.mockResolvedValueOnce({ agent_id: 'agt_456' });
			// Agent status (polling) - terminal
			mockHttpRequestWithAuthentication.mockResolvedValueOnce({
				status: 'closed',
				success: true,
				answer: 'Found pricing',
				steps: [{ action: 'navigate' }],
				task: 'Extract pricing info',
			});
			// Session cleanup
			mockHttpRequestWithAuthentication.mockResolvedValueOnce({});

			const node = new Notte();
			const result = await node.execute.call(context as never);

			expect(result[0]).toHaveLength(1);
			expect(result[0][0].json).toMatchObject({
				success: true,
				answer: 'Found pricing',
				agent_id: 'agt_456',
				session_id: 'ses_123',
				status: 'closed',
			});

			// Verify correct URLs
			expect(mockHttpRequestWithAuthentication.mock.calls[0][1].url).toContain('/sessions/start');
			expect(mockHttpRequestWithAuthentication.mock.calls[3][1].url).toContain('/sessions/ses_123/stop');
		});

		it('prepends https:// to URL without protocol', async () => {
			const { context, mockHttpRequestWithAuthentication } = createMockExecuteFunctions({
				nodeParameters: {
					mode: 'agent',
					task: 'Test',
					url: 'example.com',
					agentOptions: {},
				},
			});

			mockHttpRequestWithAuthentication.mockResolvedValueOnce({ session_id: 'ses_1' });
			mockHttpRequestWithAuthentication.mockResolvedValueOnce({ agent_id: 'agt_1' });
			mockHttpRequestWithAuthentication.mockResolvedValueOnce({ status: 'closed', success: true });
			mockHttpRequestWithAuthentication.mockResolvedValueOnce({});

			const node = new Notte();
			await node.execute.call(context as never);

			// The agent start call (2nd call) should have https:// prepended
			const agentStartBody = mockHttpRequestWithAuthentication.mock.calls[1][1].body;
			expect(agentStartBody.url).toBe('https://example.com');
		});

		it('passes optional agent params', async () => {
			const { context, mockHttpRequestWithAuthentication } = createMockExecuteFunctions({
				nodeParameters: {
					mode: 'agent',
					task: 'Login and scrape',
					url: '',
					agentOptions: {
						maxSteps: 20,
						vaultId: 'vlt_abc',
						personaId: 'per_def',
						useVision: false,
						reasoningModel: 'gpt-4o',
						proxy: true,
					},
				},
			});

			mockHttpRequestWithAuthentication.mockResolvedValueOnce({ session_id: 'ses_1' });
			mockHttpRequestWithAuthentication.mockResolvedValueOnce({ agent_id: 'agt_1' });
			mockHttpRequestWithAuthentication.mockResolvedValueOnce({ status: 'closed', success: true });
			mockHttpRequestWithAuthentication.mockResolvedValueOnce({});

			const node = new Notte();
			await node.execute.call(context as never);

			// Session start should have proxies
			const sessionBody = mockHttpRequestWithAuthentication.mock.calls[0][1].body;
			expect(sessionBody.proxies).toBe(true);

			// Agent start should have all optional params
			const agentBody = mockHttpRequestWithAuthentication.mock.calls[1][1].body;
			expect(agentBody.max_steps).toBe(20);
			expect(agentBody.vault_id).toBe('vlt_abc');
			expect(agentBody.persona_id).toBe('per_def');
			expect(agentBody.use_vision).toBe(false);
			expect(agentBody.reasoning_model).toBe('gpt-4o');
		});

		it('cleans up session on agent error', async () => {
			const { context, mockHttpRequestWithAuthentication } = createMockExecuteFunctions({
				nodeParameters: {
					mode: 'agent',
					task: 'Fail task',
					url: '',
					agentOptions: {},
				},
			});

			mockHttpRequestWithAuthentication.mockResolvedValueOnce({ session_id: 'ses_1' });
			mockHttpRequestWithAuthentication.mockRejectedValueOnce({ message: 'Agent start failed' });
			// Cleanup calls
			mockHttpRequestWithAuthentication.mockResolvedValueOnce({});

			const node = new Notte();
			await expect(node.execute.call(context as never)).rejects.toThrow();

			// Should have attempted session cleanup (DELETE /sessions/ses_1)
			const cleanupCalls = mockHttpRequestWithAuthentication.mock.calls.filter(
				(call) => call[1].method === 'DELETE',
			);
			expect(cleanupCalls.length).toBeGreaterThan(0);
		});

		it('parses responseFormat JSON string', async () => {
			const { context, mockHttpRequestWithAuthentication } = createMockExecuteFunctions({
				nodeParameters: {
					mode: 'agent',
					task: 'Extract data',
					url: '',
					agentOptions: {
						responseFormat: '{"type": "object", "properties": {"name": {"type": "string"}}}',
					},
				},
			});

			mockHttpRequestWithAuthentication.mockResolvedValueOnce({ session_id: 'ses_1' });
			mockHttpRequestWithAuthentication.mockResolvedValueOnce({ agent_id: 'agt_1' });
			mockHttpRequestWithAuthentication.mockResolvedValueOnce({ status: 'closed', success: true });
			mockHttpRequestWithAuthentication.mockResolvedValueOnce({});

			const node = new Notte();
			await node.execute.call(context as never);

			const agentBody = mockHttpRequestWithAuthentication.mock.calls[1][1].body;
			expect(agentBody.response_format).toEqual({
				type: 'object',
				properties: { name: { type: 'string' } },
			});
		});
	});

	describe('Scrape mode', () => {
		it('sends correct body to POST /scrape', async () => {
			const { context, mockHttpRequestWithAuthentication } = createMockExecuteFunctions({
				nodeParameters: {
					mode: 'scrape',
					scrapeUrl: 'https://example.com/pricing',
					instructions: 'Extract plan names and prices',
					scrapeResponseFormat: '{"type": "object"}',
					scrapeOptions: {},
				},
			});

			mockHttpRequestWithAuthentication.mockResolvedValueOnce({
				markdown: '# Pricing',
				structured: { plans: [] },
			});

			const node = new Notte();
			const result = await node.execute.call(context as never);

			expect(mockHttpRequestWithAuthentication).toHaveBeenCalledWith(
				'notteApi',
				expect.objectContaining({
					url: 'https://api.test.notte.cc/scrape',
					method: 'POST',
				}),
			);

			const body = mockHttpRequestWithAuthentication.mock.calls[0][1].body;
			expect(body.url).toBe('https://example.com/pricing');
			expect(body.instructions).toBe('Extract plan names and prices');
			expect(body.response_format).toEqual({ type: 'object' });

			expect(result[0][0].json).toMatchObject({
				success: true,
				data: { plans: [] },
			});
		});

		it('throws on invalid responseFormat JSON', async () => {
			const { context } = createMockExecuteFunctions({
				nodeParameters: {
					mode: 'scrape',
					scrapeUrl: 'https://example.com',
					instructions: 'Extract data',
					scrapeResponseFormat: 'not valid json',
					scrapeOptions: {},
				},
			});

			const node = new Notte();
			await expect(node.execute.call(context as never)).rejects.toThrow(
				'Response Format must be valid JSON',
			);
		});

		it('applies optional scrape params', async () => {
			const { context, mockHttpRequestWithAuthentication } = createMockExecuteFunctions({
				nodeParameters: {
					mode: 'scrape',
					scrapeUrl: 'https://example.com',
					instructions: 'Extract data',
					scrapeResponseFormat: '{"type": "object"}',
					scrapeOptions: {
						selector: '.main-content',
						proxy: true,
						scrapeImages: true,
					},
				},
			});

			mockHttpRequestWithAuthentication.mockResolvedValueOnce({ markdown: '', structured: {} });

			const node = new Notte();
			await node.execute.call(context as never);

			const body = mockHttpRequestWithAuthentication.mock.calls[0][1].body;
			expect(body.selector).toBe('.main-content');
			expect(body.proxies).toBe(true);
			expect(body.scrape_images).toBe(true);
		});

		it('omits optional instructions and response format when empty', async () => {
			const { context, mockHttpRequestWithAuthentication } = createMockExecuteFunctions({
				nodeParameters: {
					mode: 'scrape',
					scrapeUrl: 'https://example.com',
					instructions: '',
					scrapeResponseFormat: '',
					scrapeOptions: {},
				},
			});

			mockHttpRequestWithAuthentication.mockResolvedValueOnce({ markdown: '# Example', structured: {} });

			const node = new Notte();
			const result = await node.execute.call(context as never);

			const body = mockHttpRequestWithAuthentication.mock.calls[0][1].body;
			expect(body).not.toHaveProperty('instructions');
			expect(body).not.toHaveProperty('response_format');
			expect(result[0][0].json).toMatchObject({
				success: true,
				data: '# Example',
			});
		});
	});

	describe('Function mode', () => {
		it('starts function run and polls until closed', async () => {
			const { context, mockHttpRequestWithAuthentication } = createMockExecuteFunctions({
				nodeParameters: {
					mode: 'function',
					functionId: 'fn_abc123',
					variables: {
						variableValues: [{ name: 'target_url', value: 'https://example.com' }],
					},
					functionOptions: { waitForCompletion: true, timeout: 60, pollInterval: 1 },
				},
			});

			mockHttpRequestWithAuthentication
				.mockResolvedValueOnce({
					statusCode: 200,
					headers: {},
					body: { function_run_id: 'run_789' },
				})
				.mockResolvedValueOnce({
					status: 'closed',
					result: 'All done',
					logs: ['step 1', 'step 2'],
				});

			const node = new Notte();
			const result = await node.execute.call(context as never);

			expect(mockHttpRequestWithAuthentication).toHaveBeenCalledTimes(2);
			expect(mockHttpRequestWithAuthentication).toHaveBeenNthCalledWith(
				1,
				'notteApi',
				expect.objectContaining({
					url: 'https://api.test.notte.cc/functions/fn_abc123/runs/start',
					method: 'POST',
					body: {
						workflow_id: 'fn_abc123',
						variables: { target_url: 'https://example.com' },
					},
					headers: expect.objectContaining({
						Accept: 'application/json',
						'Content-Type': 'application/json',
					}),
					returnFullResponse: true,
					disableFollowRedirect: true,
					ignoreHttpStatusErrors: true,
				}),
			);

			expect(result[0][0].json).toMatchObject({
				success: true,
				function_id: 'fn_abc123',
				function_run_id: 'run_789',
				status: 'closed',
				result: 'All done',
			});
		});

		it('returns immediately when waitForCompletion is false', async () => {
			const { context, mockHttpRequestWithAuthentication } = createMockExecuteFunctions({
				nodeParameters: {
					mode: 'function',
					functionId: 'fn_abc123',
					variables: {},
					functionOptions: { waitForCompletion: false },
				},
			});

			mockHttpRequestWithAuthentication.mockResolvedValueOnce({
				statusCode: 200,
				headers: {},
				body: { function_run_id: 'run_789' },
			});

			const node = new Notte();
			const result = await node.execute.call(context as never);

			expect(mockHttpRequestWithAuthentication).toHaveBeenCalledTimes(1);
			expect(mockHttpRequestWithAuthentication).toHaveBeenCalledWith(
				'notteApi',
				expect.objectContaining({
					url: 'https://api.test.notte.cc/functions/fn_abc123/runs/start',
					method: 'POST',
					returnFullResponse: true,
					disableFollowRedirect: true,
					ignoreHttpStatusErrors: true,
				}),
			);
			expect(result[0][0].json).toMatchObject({
				success: true,
				status: 'started',
				function_run_id: 'run_789',
			});
		});
	});

	describe('Error handling', () => {
		it('continueOnFail returns error object instead of throwing', async () => {
			const { context, mockHttpRequestWithAuthentication } = createMockExecuteFunctions({
				nodeParameters: {
					mode: 'agent',
					task: 'Fail',
					url: '',
					agentOptions: {},
				},
				continueOnFail: true,
			});

			mockHttpRequestWithAuthentication.mockRejectedValue({ message: 'API down' });

			const node = new Notte();
			const result = await node.execute.call(context as never);

			expect(result[0][0].json).toMatchObject({
				success: false,
			});
			expect(result[0][0].json.error).toBeDefined();
		});
	});
});
