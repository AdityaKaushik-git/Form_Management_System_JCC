import pino from 'pino';

const env = process.env.NODE_ENV || 'development';

const devTransport = {
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
    ignore: 'pid,hostname',
  },
};

const logger = pino({
  level: process.env.LOG_LEVEL || (env === 'production' ? 'info' : 'debug'),
  ...(env !== 'production' && { transport: devTransport }),
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  base: env === 'production' ? { pid: process.pid } : undefined,
});

export default logger;
