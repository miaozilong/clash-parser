module.exports.parse = async (raw, { axios, yaml, notify, console }, { name, url, interval, selected }) => {
    console.log("111")
    const obj = yaml.parse(raw)
    return yaml.stringify(obj)
}