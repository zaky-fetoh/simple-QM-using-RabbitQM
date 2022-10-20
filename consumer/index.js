const express = require("express");
const amqp = require("amqplib");
const morgan = require("morgan")

ConsPORT = process.env.PORT || 3001
RABBITMQ_HOST = process.env.RABBITMQ_HOST || "amqp://localhost:5672"

QforTopic = {}; 

(async()=>{
    express().use(morgan())
    .use(express.urlencoded()).use(express.json())
    .get("/listen-to/:topic",async(req, res,next)=>{
        const topic = req.params.topic;
        if(QforTopic[topic]) res.status(500).json({
            ok:false, error: "Server is already listening",
            Qid: QforTopic[topic],
        })
        //setting connectio to the RAbbitMQ
        const mqConnc = await amqp.connect(RABBITMQ_HOST);
        const chunnel = await mqConnc.createChannel();
        //Creating Q
        const q = await chunnel.assertQueue("",{
            durable:true,
        });
        QforTopic[topic] = q.queue; 
        //creating Exchange Point
        const exch = chunnel.assertExchange("MASSAGES","topic",{
            durable:true,
        });
        //creating binding
        chunnel.bindQueue(QforTopic[topic],exch, topic)

    }).listen(ConsPORT,()=>{
        console.log("Consumer Stared")
    })
})()