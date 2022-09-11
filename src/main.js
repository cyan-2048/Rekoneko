import App from "./App.svelte";

const app = new App({
	target: document.body,
	props: {
		name: "world",
	},
});

function test() {
	return new Promise((res) => setTimeout(res, 2000, "hewo"));
}

async function testTimeout() {
	const data = await test();
	return data;
}

async function finalTest() {
	const test = await testTimeout();
	console.log(test);
}

finalTest();

export default app;
