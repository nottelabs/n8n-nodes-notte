import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	IPollFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
} from 'n8n-workflow';
import { NodeOperationError, sleep } from 'n8n-workflow';

export async function notteApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions | IPollFunctions | IHookFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: object,
	qs?: Record<string, string | number | boolean>,
): Promise<unknown> {
	const credentials = await this.getCredentials('notteApi');
	const baseUrl = (credentials.baseUrl as string) || 'https://api.notte.cc';

	const options: IHttpRequestOptions = {
		method,
		url: `${baseUrl}${endpoint}`,
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
			Authorization: `Bearer ${credentials.apiKey as string}`,
		},
		json: true,
	};

	if (body && Object.keys(body).length > 0) {
		options.body = body;
	}

	if (qs && Object.keys(qs).length > 0) {
		options.qs = qs;
	}

	try {
		return await this.helpers.httpRequest(options);
	} catch (error: unknown) {
		const err = error as { response?: { data?: unknown }; message?: string };
		const detail = err.response?.data
			? JSON.stringify(err.response.data)
			: (err.message ?? 'Unknown error');
		throw new NodeOperationError(this.getNode(), `Notte API error (${endpoint}): ${detail}`);
	}
}

export async function notteApiRequestWithPolling(
	this: IExecuteFunctions,
	pollMethod: IHttpRequestMethods,
	pollEndpoint: string,
	statusField: string,
	terminalStatuses: string[],
	pollIntervalMs: number = 2000,
	timeoutMs: number = 300000,
): Promise<unknown> {
	const startTime = Date.now();

	while (Date.now() - startTime < timeoutMs) {
		const response = (await notteApiRequest.call(this, pollMethod, pollEndpoint)) as IDataObject;
		const status = response[statusField] as string;

		if (terminalStatuses.includes(status)) {
			return response;
		}

		await sleep(pollIntervalMs);
	}

	throw new NodeOperationError(
		this.getNode(),
		`Polling timed out after ${timeoutMs / 1000}s waiting for ${pollEndpoint}`,
	);
}
