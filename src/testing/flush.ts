// Waits one macrotask so pending promise chains (e.g. an app's ready gate)
// settle before asserting.
export const flush = (): Promise<void> =>
	new Promise((resolve) => {
		setTimeout(resolve, 0);
	});
