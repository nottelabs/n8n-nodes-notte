import type { INodeProperties } from 'n8n-workflow';

export const functionFields: INodeProperties[] = [
	{
		displayName: 'Function ID',
		name: 'functionId',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'e.g. fn_abc123',
		description: 'The ID of the Notte function to run (deploy functions via the Notte CLI)',
		displayOptions: {
			show: {
				mode: ['function'],
			},
		},
	},
	{
		displayName: 'Variables',
		name: 'variables',
		type: 'fixedCollection',
		typeOptions: { multipleValues: true },
		default: {},
		placeholder: 'Add Variable',
		description: 'Key-value variables to pass to the function',
		displayOptions: {
			show: {
				mode: ['function'],
			},
		},
		options: [
			{
				name: 'variableValues',
				displayName: 'Variable',
				values: [
					{
						displayName: 'Name',
						name: 'name',
						type: 'string',
						default: '',
						placeholder: 'e.g. target_url',
						description: 'Variable name',
					},
					{
						displayName: 'Value',
						name: 'value',
						type: 'string',
						default: '',
						placeholder: 'e.g. https://example.com',
						description: 'Variable value (supports n8n expressions)',
					},
				],
			},
		],
	},
	{
		displayName: 'Options',
		name: 'functionOptions',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				mode: ['function'],
			},
		},
		options: [
			{
				displayName: 'Wait for Completion',
				name: 'waitForCompletion',
				type: 'boolean',
				default: true,
				description: 'Whether to wait for the function run to complete before continuing',
			},
			{
				displayName: 'Timeout (Seconds)',
				name: 'timeout',
				type: 'number',
				default: 300,
				typeOptions: {
					minValue: 10,
					maxValue: 3600,
				},
				description: 'Maximum time to wait for completion in seconds',
			},
			{
				displayName: 'Poll Interval (Seconds)',
				name: 'pollInterval',
				type: 'number',
				default: 2,
				typeOptions: {
					minValue: 1,
					maxValue: 60,
				},
				description: 'How often to check function run status',
			},
		],
	},
];
