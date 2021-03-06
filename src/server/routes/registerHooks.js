import logPrinter from '../logPrinter';
import ruleValidator from '../middleware/ruleValidator';
import parseJsonValidator from '../middleware/parseJsonValidator';
import runCommand from '../process/runCommand';
import pickVariablesFromJson from '../utils/pickVariablesFromJson';
import validateHook from '../validation/validateHook';

/**
 * Registers hook endpoints
 * @param {Object} params
 * @param {Object} params.router Express router
 * @param {Array} params.hooks Webhooks.json config entries
 * @return {void}
 */
export default function registerHooks({ router, hooks }) {
    if (!router) throw new Error('No router provided');
    if (!hooks) throw new Error('No hooks provided');

    hooks.forEach((hook) => {
        validateHook(hook);
        registerHook({ router, ...hook });
    });
}

function registerHook(params) {
    if (Array.isArray(params.method)) {
        params.method.forEach((m) => registerHook({ ...params, method: m }));
    } else {
        addRoute(params);
    }
}

function addRoute({ router, method, path, command, cwd, parseJson, validate }) {
    router.use(path, ruleValidator(validate));
    router.use(path, parseJsonValidator(parseJson));

    router[method.toLowerCase()](path, (req, res) => {
        const id = Date.now();
        const logger = logPrinter.create(id);
        logger.logStart(method, path);

        const env = pickVariablesFromJson(req.body, parseJson);
        const options = { cwd, env };
        runCommand(command, options, logger);
        res.json({ path, requestReceivedAt: Date.now() });
    });
}
