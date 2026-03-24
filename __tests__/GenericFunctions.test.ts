import {
	notteApiRequest,
	notteApiRequestWithPolling,
	notteApiRequestWithRedirect,
} from '../nodes/Notte/GenericFunctions';
import { sleep } from 'n8n-workflow';
import { createMockExecuteFunctions } from './helpers';

// Mock n8n-workflow's sleep to avoid real delays in tests
jest.mock('n8n-workflow', () => {
	const actual = jest.requireActual('n8n-workflow');
	return {
		...actual,
		sleep: jest.fn().mockResolvedValue(undefined),
	};
});

describe('notteApiRequest', () => {
	it('builds correct URL from credentials baseUrl + endpoint', async () => {
		const { context, mockHttpRequestWithAuthentication } = createMockExecuteFunctions();
		mockHttpRequestWithAuthentication.mockResolvedValue({ status: 'ok' });

		await notteApiRequest.call(context as never, 'GET', '/health');

		expect(mockHttpRequestWithAuthentication).toHaveBeenCalledWith(
			'notteApi',
			expect.objectContaining({
				url: 'https://api.test.notte.cc/health',
				method: 'GET',
			}),
		);
	});

	it('delegates authentication to the credential helper', async () => {
		const { context, mockHttpRequestWithAuthentication } = createMockExecuteFunctions();
		mockHttpRequestWithAuthentication.mockResolvedValue({});

		await notteApiRequest.call(context as never, 'GET', '/test');

		expect(mockHttpRequestWithAuthentication).toHaveBeenCalledWith(
			'notteApi',
			expect.objectContaining({
				headers: expect.objectContaining({
					Accept: 'application/json',
					'Content-Type': 'application/json',
				}),
			}),
		);
	});

	it('passes body when provided', async () => {
		const { context, mockHttpRequestWithAuthentication } = createMockExecuteFunctions();
		mockHttpRequestWithAuthentication.mockResolvedValue({});

		await notteApiRequest.call(context as never, 'POST', '/sessions', {
			headless: true,
		});

		expect(mockHttpRequestWithAuthentication).toHaveBeenCalledWith(
			'notteApi',
			expect.objectContaining({
				body: { headless: true },
			}),
		);
	});

	it('does not include body when empty', async () => {
		const { context, mockHttpRequestWithAuthentication } = createMockExecuteFunctions();
		mockHttpRequestWithAuthentication.mockResolvedValue({});

		await notteApiRequest.call(context as never, 'GET', '/test', {});

		const callArgs = mockHttpRequestWithAuthentication.mock.calls[0][1];
		expect(callArgs.body).toBeUndefined();
	});

	it('passes query string params when provided', async () => {
		const { context, mockHttpRequestWithAuthentication } = createMockExecuteFunctions();
		mockHttpRequestWithAuthentication.mockResolvedValue({});

		await notteApiRequest.call(context as never, 'GET', '/test', undefined, {
			only_unread: true,
		});

		expect(mockHttpRequestWithAuthentication).toHaveBeenCalledWith(
			'notteApi',
			expect.objectContaining({
				qs: { only_unread: true },
			}),
		);
	});

	it('throws NodeOperationError on API failure with detail', async () => {
		const { context, mockHttpRequestWithAuthentication } = createMockExecuteFunctions();
		mockHttpRequestWithAuthentication.mockRejectedValue({
			response: { data: { error: 'Unauthorized' } },
		});

		await expect(
			notteApiRequest.call(context as never, 'GET', '/test'),
		).rejects.toThrow('Notte API error (/test)');
	});

	it('uses default baseUrl when credentials baseUrl is empty', async () => {
		const { context, mockHttpRequestWithAuthentication } = createMockExecuteFunctions({
			credentials: { apiKey: 'key', baseUrl: '' },
		});
		mockHttpRequestWithAuthentication.mockResolvedValue({});

		await notteApiRequest.call(context as never, 'GET', '/health');

		expect(mockHttpRequestWithAuthentication).toHaveBeenCalledWith(
			'notteApi',
			expect.objectContaining({
				url: 'https://api.notte.cc/health',
			}),
		);
	});

	it('merges extraHeaders into request headers', async () => {
		const { context, mockHttpRequestWithAuthentication } = createMockExecuteFunctions();
		mockHttpRequestWithAuthentication.mockResolvedValue({});

		await notteApiRequest.call(context as never, 'POST', '/test', {}, undefined, {
			'x-notte-api-key': 'extra-key',
		});

		expect(mockHttpRequestWithAuthentication).toHaveBeenCalledWith(
			'notteApi',
			expect.objectContaining({
				headers: expect.objectContaining({
					'x-notte-api-key': 'extra-key',
				}),
			}),
		);
	});
});

describe('notteApiRequestWithRedirect', () => {
	it('makes request through n8n helper and returns body on success', async () => {
		const { context, mockHttpRequestWithAuthentication } = createMockExecuteFunctions();
		mockHttpRequestWithAuthentication.mockResolvedValueOnce({
			statusCode: 200,
			headers: {},
			body: { result: 'ok' },
		});

		const result = await notteApiRequestWithRedirect.call(
			context as never,
			'POST',
			'/functions/fn1/runs/start',
			{ workflow_id: 'fn1' },
		);

		expect(result).toEqual({ result: 'ok' });
		expect(mockHttpRequestWithAuthentication).toHaveBeenCalledTimes(1);
		expect(mockHttpRequestWithAuthentication).toHaveBeenCalledWith(
			'notteApi',
			expect.objectContaining({
				url: 'https://api.test.notte.cc/functions/fn1/runs/start',
				method: 'POST',
				body: { workflow_id: 'fn1' },
				returnFullResponse: true,
				disableFollowRedirect: true,
				ignoreHttpStatusErrors: true,
				headers: expect.objectContaining({
					Accept: 'application/json',
					'Content-Type': 'application/json',
				}),
			}),
		);
	});

	it('follows redirect preserving headers via n8n helper', async () => {
		const { context, mockHttpRequestWithAuthentication } = createMockExecuteFunctions();
		mockHttpRequestWithAuthentication
			.mockResolvedValueOnce({
				statusCode: 307,
				headers: { location: 'https://lambda.example.com/run' },
				body: null,
			})
			.mockResolvedValueOnce({
				statusCode: 200,
				headers: {},
				body: { redirected: true },
			});

		const result = await notteApiRequestWithRedirect.call(
			context as never,
			'POST',
			'/functions/fn1/runs/start',
			{ workflow_id: 'fn1' },
		);

		expect(result).toEqual({ redirected: true });
		expect(mockHttpRequestWithAuthentication).toHaveBeenCalledTimes(2);
		expect(mockHttpRequestWithAuthentication).toHaveBeenNthCalledWith(
			2,
			'notteApi',
			expect.objectContaining({
				url: 'https://lambda.example.com/run',
				disableFollowRedirect: false,
				headers: expect.objectContaining({
					Accept: 'application/json',
					'Content-Type': 'application/json',
				}),
			}),
		);
	});
});

describe('notteApiRequestWithPolling', () => {
	it('returns response when terminal status reached', async () => {
		const { context, mockHttpRequestWithAuthentication } = createMockExecuteFunctions();
		mockHttpRequestWithAuthentication.mockResolvedValue({ status: 'closed', answer: 'done' });

		const result = await notteApiRequestWithPolling.call(
			context as never,
			'GET',
			'/agents/123',
			'status',
			['closed', 'error'],
			100,
			5000,
		);

		expect(result).toEqual({ status: 'closed', answer: 'done' });
	});

	it('polls multiple times until terminal status', async () => {
		const { context, mockHttpRequestWithAuthentication } = createMockExecuteFunctions();
		mockHttpRequestWithAuthentication
			.mockResolvedValueOnce({ status: 'active' })
			.mockResolvedValueOnce({ status: 'active' })
			.mockResolvedValueOnce({ status: 'closed', answer: 'result' });

		const result = await notteApiRequestWithPolling.call(
			context as never,
			'GET',
			'/agents/123',
			'status',
			['closed', 'error'],
			10,
			5000,
		);

		expect(mockHttpRequestWithAuthentication).toHaveBeenCalledTimes(3);
		expect(result).toEqual({ status: 'closed', answer: 'result' });
	});

	it('throws on timeout', async () => {
		jest.useFakeTimers();
		jest.setSystemTime(new Date('2024-01-01T00:00:00.000Z'));

		const { context, mockHttpRequestWithAuthentication } = createMockExecuteFunctions();
		const mockedSleep = jest.mocked(sleep);

		mockHttpRequestWithAuthentication.mockResolvedValue({ status: 'active' });
		mockedSleep.mockImplementation(async (ms?: number) => {
			jest.advanceTimersByTime(ms ?? 0);
		});

		await expect(
			notteApiRequestWithPolling.call(
				context as never,
				'GET',
				'/agents/123',
				'status',
				['closed', 'error'],
				1000,
				2000,
			),
		).rejects.toThrow('Polling timed out after 2s waiting for /agents/123');

		expect(mockHttpRequestWithAuthentication).toHaveBeenCalledTimes(2);
		mockedSleep.mockResolvedValue(undefined);
		jest.useRealTimers();
	});
});
