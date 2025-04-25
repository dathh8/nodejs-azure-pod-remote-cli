const fs = require('fs');
const mappingTypeWithPath = {
    "view-exception": "var/log/exception.log",
    "view-system": "var/log/system.log",
};
const mappingCommandOfEnv = {
    "dev": `kubectl config use-context ${process.env.DEV_CONTEXT}`,
    "uat":`kubectl config use-context ${process.env.UAT_CONTEXT}`,
    "preprod": `kubectl config use-context ${process.env.PREPROD_CONTEXT}`
}
const scriptContent = "<?php use Magento\\Framework\\App\\Bootstrap; use Magento\\Framework\\App\\State; require __DIR__ . '/app/bootstrap.php' ; $bootstrap=Bootstrap::create(BP,$_SERVER); $objectManager=$bootstrap->getObjectManager(); $object = new Run($objectManager); $object->publish(); class Run { protected $objectManager; public function __construct($objectManager) { $this->objectManager=$objectManager; } public function publish() { $publisher=$this->objectManager->create(\\Magento\\Framework\\MessageQueue\\PublisherInterface::class); $event=[EVENT_IDS_REPLACE_ME]; foreach($event as $eventId) { $eventId=(string)$eventId; $publisher->publish('sosc.queue.ordering.event.generated.order', [$eventId] );} return $this; } }";
const submitContent = "<?php use Magento\\Framework\\App\\Bootstrap; use Magento\\Framework\\App\\State; require __DIR__ . '/app/bootstrap.php' ; $bootstrap=Bootstrap::create(BP,$_SERVER); $objectManager=$bootstrap->getObjectManager(); $object = new Run($objectManager); $object->publish(); class Run { protected $objectManager; public function __construct($objectManager) { $this->objectManager=$objectManager; } public function publish() { $publisher=$this->objectManager->create(\\Magento\\Framework\\MessageQueue\\PublisherInterface::class); $data=[LIST_ID]; foreach($data as $id) {  $publisher->publish('sosc.queue.push.pre.defined.order.request', json_encode(['sosc_order_request_id' => (string) $id]) );} return $this; } }";

const getCommand = commandArray => {
    const commandTag = commandArray[0];
    let command = '';
    switch (commandTag) {
        case 'open-database':
            command = [
                'sh',
                '-c',
                'cd pub && curl -s -o health_check.php -L "http://www.adminer.org/latest.php" && supervisorctl restart php-fpm'
            ];
            break;
        case 'generate-promo':
            command = [
                'sh',
                '-c',
                'curl -O https://files.magerun.net/n98-magerun2.phar && chmod +x ./n98-magerun2.phar && php n98-magerun2.phar sys:cron:run sosc_ordering_event_generate_order'
            ];
            break;
        case 'generate-promo-by-event':
            let text = scriptContent.replace('EVENT_IDS_REPLACE_ME', commandArray[1]);
            let text1 = JSON.stringify(text);
            let escaped = text.replace(/'/g, "'\\''");
            command = [
                'sh',
                '-c',
                `touch run.php && printf '%s' '${escaped}' > run.php && php run.php`
            ];
            break;
        case 'submit-order-by-ids':
            let text2 = submitContent.replace('LIST_ID', commandArray[1]);
            let text3 = JSON.stringify(text2);
            let escaped1 = text2.replace(/'/g, "'\\''");
            command = [
                'sh',
                '-c',
                `touch submitOrder.php && printf '%s' '${escaped1}' > submitOrder.php && php submitOrder.php`
            ];
            break;
        case 'search-logs':
            command = [
                "grep",
                commandArray[1],
                commandArray[2]
            ];
            break;
        default:
            if (commandTag !== 'view-log') {
                commandArray[2] = mappingTypeWithPath[commandTag];
            }
            command = [
                'sh',
                '-c',
                `tail -n ${commandArray[1]} ${commandArray[2]}`
            ];
            break;
    }
    return command;
};

const getSwitchCommand = mode => {
    return mappingCommandOfEnv[mode];
}

module.exports = {
    getCommand,
    getSwitchCommand
}