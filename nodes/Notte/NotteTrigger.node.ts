import {
	NodeConnectionTypes,
	type IDataObject,
	type IPollFunctions,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
} from 'n8n-workflow';

import { notteApiRequest } from './GenericFunctions';

// Trigger/polling nodes have no execute() method and cannot be invoked as AI tools.
// eslint-disable-next-line @n8n/community-nodes/node-usable-as-tool
export class NotteTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Notte Trigger',
		name: 'notteTrigger',
		icon: 'file:../../icons/notte.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{ "Trigger: " + $parameter["event"] }}',
		description: 'Triggers on new Notte persona emails or SMS messages',
		defaults: {
			name: 'Notte Trigger',
		},
		polling: true,
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'notteApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'New Email',
						value: 'newEmail',
						description: 'Triggers when a persona receives a new email',
					},
					{
						name: 'New SMS',
						value: 'newSms',
						description: 'Triggers when a persona receives a new SMS',
					},
				],
				default: 'newEmail',
			},
			{
				displayName: 'Persona ID',
				name: 'personaId',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'e.g. per_abc123',
				description: 'The persona to monitor for new messages',
			},
		],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const event = this.getNodeParameter('event') as string;
		const personaId = this.getNodeParameter('personaId') as string;

		const staticData = this.getWorkflowStaticData('node');
		const lastSeen = (staticData.lastSeen as string) || '';

		let endpoint: string;
		let idField: string;
		let timestampField: string;

		if (event === 'newEmail') {
			endpoint = `/personas/${personaId}/emails`;
			idField = 'email_id';
			timestampField = 'created_at';
		} else {
			endpoint = `/personas/${personaId}/sms`;
			idField = 'sms_id';
			timestampField = 'created_at';
		}

		const response = (await notteApiRequest.call(this, 'GET', endpoint, undefined, {
			only_unread: true,
		})) as IDataObject[];

		if (!Array.isArray(response) || response.length === 0) {
			return null;
		}

		// Filter to only items newer than lastSeen
		const newItems = lastSeen
			? response.filter((item) => {
					const itemTime = item[timestampField] as string;
					return itemTime > lastSeen;
				})
			: response;

		if (newItems.length === 0) {
			return null;
		}

		// Update lastSeen to the most recent item
		const sortedItems = [...newItems].sort((a, b) => {
			const timeA = a[timestampField] as string;
			const timeB = b[timestampField] as string;
			return timeB.localeCompare(timeA);
		});

		staticData.lastSeen = sortedItems[0][timestampField] as string;

		const returnData: INodeExecutionData[] = newItems.map((item) => ({
			json: {
				...item,
				id: item[idField] as string,
				persona_id: personaId,
				event_type: event,
			},
		}));

		return [returnData];
	}
}
