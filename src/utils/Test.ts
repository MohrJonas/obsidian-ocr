export function describe(desc: string, ...funcs: Array<Test>): Description {
	return new Description(desc, funcs);
}

export function test(desc: string, func: () => void): Test {
	return new Test(desc, func);
}

export class Test {
	constructor(readonly desc: string, readonly func: () => void) {
	}
}

export class Description {
	constructor(readonly desc: string, readonly funcs: Array<Test>) {
	}

	run() {
		console.log(`🤵 Running test suite ${this.desc}`);
		this.funcs.forEach((func) => {
			console.log(`📝 Running test ${func.desc}`);
			try {
				func.func();
				console.log("✔️ Okay");
			}
			catch (e) {
				console.log("❌️ Failed");
				throw e;
			}
		});
		console.log("✨️ Done");
	}
}