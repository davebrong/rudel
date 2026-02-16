import { createServer } from "node:http";
import { RPCHandler } from "@orpc/server/node";
import { CORSPlugin } from "@orpc/server/plugins";
import { router } from "./router.js";

const handler = new RPCHandler(router, {
	plugins: [new CORSPlugin()],
});

const server = createServer(async (req, res) => {
	const { matched } = await handler.handle(req, res, {
		prefix: "/rpc",
		context: {},
	});

	if (matched) {
		return;
	}

	res.statusCode = 404;
	res.end("Not found");
});

const port = process.env.PORT ?? 4010;

server.listen(port, () => {
	console.log(`API server listening on http://localhost:${port}`);
});
