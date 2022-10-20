const express = require("express");
const morgan = require("morgan")
const amqp = require("amqplib");

ConsPORT = process.env.PORT || 3002;
RABBITMQ_HOST = process.env.RABBITMQ_HOST || "amqp://localhost:5672";






(async () => {
    //setting connectio to the RAbbitMQ
    const mqConnc = await amqp.connect(RABBITMQ_HOST);
    const chunnel = await mqConnc.createChannel();

    async function clear() {
        await mqConnc.close()
    }

    process.on("beforeExit", clear);
    process.on("exit", clear);

    express().use(morgan()).use(express.urlencoded())
        .use(express.json())
        .post("/sendto/:topic", async (req, res, next) => {
            const data = Buffer.from(JSON.stringify(req.body));
            const topic = req.params.topic;
            const exch = chunnel.assertExchange("MESSAGES", "topic", {
                durable: true,
            });
            chunnel.publish(exch, topic, data);
            res.status(200).json({
                message: "data sent",
                ok: true,
            })
        })

})(); 