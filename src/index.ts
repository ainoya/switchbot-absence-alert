/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
	// Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
	KV: KVNamespace;
	//
	PUSHOVER_KEY: string;
	PUSHOVER_USER_KEY: string;
	TARGET_SENSOR_ID: string;
	// Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
	// MY_DURABLE_OBJECT: DurableObjectNamespace;
	//
	// Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
	// MY_BUCKET: R2Bucket;
	//
	// Example binding to a Service. Learn more at https://developers.cloudflare.com/workers/runtime-apis/service-bindings/
	// MY_SERVICE: Fetcher;
	//
	// Example binding to a Queue. Learn more at https://developers.cloudflare.com/queues/javascript-apis/
	// MY_QUEUE: Queue;
}

type SwitchBotEvent = {
	eventType: string;
	context: {
		deviceType: string;
		deviceMac: string;
		detectionState: string;
		timeOfSample: number;
	};
};

const isSwitchBotEvent = (obj: unknown): obj is SwitchBotEvent => {
	if (typeof obj !== 'object' || obj === null) {
		return false;
	}

	const o = obj as SwitchBotEvent;

	const context = o.context;

	console.log(`checking SwitchBotEvent... ${JSON.stringify(o)}`);

	return (
		typeof o.eventType === 'string' &&
		typeof context.deviceMac === 'string' &&
		typeof context.detectionState === 'string' &&
		typeof context.timeOfSample === 'number'
	);
};

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const sensorLastTimeStampKvKey = `last-detected-${env.TARGET_SENSOR_ID}`;
		const sensorId = env.TARGET_SENSOR_ID;
		// Process only if the request is to _swtchbt_webhk and the method is POST
		if (request.method.toUpperCase() === 'POST' && request.url.endsWith('_swtchbt_webhk')) {
			const switchBotEvent = await request.json();

			console.log(`request body is ${JSON.stringify(switchBotEvent)}`);

			// Process only if rawJson is of type SwitchBotEvent
			if (isSwitchBotEvent(switchBotEvent)) {
				console.log(`request body is SwitchBotEvent`);
				const switchBotEventContext = switchBotEvent.context;
				if (
					switchBotEventContext.deviceType == 'WoPresence' &&
					switchBotEventContext.detectionState == 'DETECTED' &&
					switchBotEventContext.deviceMac == sensorId
				) {
					await env.KV.put(sensorLastTimeStampKvKey, switchBotEventContext.timeOfSample.toString());
					console.log(`${sensorLastTimeStampKvKey} is updated to ${switchBotEventContext.timeOfSample}`);
				}
			}

			return new Response('OK', { status: 200 });
		}

		return new Response('Hello World!');
	},
	async scheduled(event: Event, env: Env, ctx: ExecutionContext): Promise<void> {
		// Called every 6 hours
		const sensorLastTimeStampKvKey = `last-detected-${env.TARGET_SENSOR_ID}`;
		const lastTimeStampStr = await env.KV.get(sensorLastTimeStampKvKey);

		console.log(`${sensorLastTimeStampKvKey}(raw string) is ${lastTimeStampStr}`);

		const lastTimeStamp = lastTimeStampStr ? parseInt(lastTimeStampStr) : 0;

		if (lastTimeStamp === 0) {
			console.log(`${sensorLastTimeStampKvKey} is not set`);
			return;
		}

		const now = new Date();
		// Process only if there is a time difference of more than 6 hours between the timestamp and now
		console.log(`now is ${now.getTime()}, lastTimeStamp is ${lastTimeStamp} diff: ${now.getTime() - lastTimeStamp}`);

		// if (true) {
		if (now.getTime() - lastTimeStamp > 6 * 60 * 60 * 1000) {
			console.log(`WARN: ${sensorLastTimeStampKvKey} is too old`);
			// Send a message to Pushover
			const pushoverKey = env.PUSHOVER_KEY;
			const pushOverUserKey = env.PUSHOVER_USER_KEY;
			const pushoverUrl = 'https://api.pushover.net/1/messages.json';
			const pushoverBody = new URLSearchParams();
			pushoverBody.append('token', pushoverKey);
			pushoverBody.append('user', pushOverUserKey);
			pushoverBody.append('message', 'Sensor is not detected for 6 hours');

			const pushoverResponse = await fetch(pushoverUrl, {
				method: 'POST',
				body: pushoverBody,
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
				},
			});
			const resp = await pushoverResponse.text();

			console.log(`pushover response: ${resp}`);

			return;
		}

		console.log(`OK: ${sensorLastTimeStampKvKey} is ${lastTimeStampStr}`);
	},
};
