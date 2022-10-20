const express = require("express");
const amqp = require("amqplib");
const morgan = require("morgan")

ConsPORT = process.env.PORT || 3001;
RABBITMQ_HOST = process.env.RABBITMQ_HOST || "amqp://localhost:5672";



(async () => {
    //setting connectio to the RAbbitMQ
    const mqConnc = await amqp.connect(RABBITMQ_HOST);
    const chunnel = await mqConnc.createChannel();
    QforTopic = {};

    async function clear() {
        await mqConnc.close()
        delete QforTopic
    }

    process.on("beforeExit", clear);
    process.on("exit", clear);
    express().use(morgan())
        .use(express.urlencoded()).use(express.json())
        .get("/listen-to/:topic", async (req, res, next) => {
            const topic = req.params.topic;
            if (QforTopic[topic]) return res.status(500).json({
                ok: false, error: "Server is already listening",
                Qid: QforTopic[topic],
            })
            //Creating Q
            const q = await chunnel.assertQueue("", {
                durable: true,
            });
            QforTopic[topic] = q.queue;
            //creating Exchange Point
            const exch = chunnel.assertExchange("MESSAGES", "topic", {
                durable: true,
            });
            //creating binding
            chunnel.bindQueue(QforTopic[topic], exch, topic);
            res.status(200).json({
                QName: q.queue,
                ok: true,
            })
        })
        .use("/consume/:topic", async (req, res, next) => {
            const topic = req.params.topic;
            if (!(QforTopic[topic])) return res.status(500).json({
                error: "this Topic is not rejestered for listens",
                ok: false,
            });
            const massages = [];
            let consumer = chunnel.consume(QforTopic[topic], m => {
                massages.push(JSON.parse(m.toString()))
            }, { noAck: true });
            chunnel.cancel(consumer)
            res.status(200).json({
                ok: true, massages,
            });
        })
        .listen(ConsPORT, () => {
            console.log("Consumer Stared")
        })
})()