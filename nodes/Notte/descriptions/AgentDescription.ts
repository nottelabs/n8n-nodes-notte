import type { INodeProperties } from 'n8n-workflow';

export const agentFields: INodeProperties[] = [
	{
		displayName: 'Task',
		name: 'task',
		type: 'string',
		typeOptions: { rows: 4 },
		default: '',
		required: true,
		placeholder: 'e.g. Go to the pricing page and extract all plan details',
		description: 'Natural language instruction for the AI agent',
		displayOptions: {
			show: {
				mode: ['agent'],
			},
		},
	},
	{
		displayName: 'URL',
		name: 'url',
		type: 'string',
		default: '',
		placeholder: 'e.g. https://example.com',
		description: 'Starting URL for the agent (optional if the agent should decide)',
		displayOptions: {
			show: {
				mode: ['agent'],
			},
		},
	},
	{
		displayName: 'Options',
		name: 'agentOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				mode: ['agent'],
			},
		},
		options: [
			{
				displayName: 'Headless',
				name: 'headless',
				type: 'boolean',
				default: true,
				description: 'Whether to run the browser in headless mode',
			},
			{
				displayName: 'Max Steps',
				name: 'maxSteps',
				type: 'number',
				default: 10,
				description: 'Maximum number of steps the agent can take',
			},
			{
				displayName: 'Persona ID',
				name: 'personaId',
				type: 'string',
				default: '',
				placeholder: 'e.g. per_abc123',
				description: 'Persona identity to use for the agent session',
			},
			{
				displayName: 'Proxy',
				name: 'proxy',
				type: 'boolean',
				default: false,
				description: 'Whether to route traffic through a proxy',
			},
			{
				displayName: 'Reasoning Model',
				name: 'reasoningModel',
				type: 'string',
				default: '',
				placeholder: 'e.g. gpt-4o',
				description: 'LLM model to use for agent reasoning',
			},
			{
				displayName: 'Response Format',
				name: 'responseFormat',
				type: 'json',
				default: '',
				placeholder: '{"type": "object", "properties": {"name": {"type": "string"}}}',
				description: 'JSON schema for structured agent output',
			},
			{
				displayName: 'Solve Captchas',
				name: 'solveCaptchas',
				type: 'boolean',
				default: false,
				description: 'Whether to automatically solve captchas',
			},
			{
				displayName: 'Use Vision',
				name: 'useVision',
				type: 'boolean',
				default: true,
				description: 'Whether to enable vision capabilities for the agent',
			},
			{
				displayName: 'Vault ID',
				name: 'vaultId',
				type: 'string',
				default: '',
				placeholder: 'e.g. vlt_abc123',
				description: 'Vault containing credentials for auto-login',
			},
		],
	},
];
