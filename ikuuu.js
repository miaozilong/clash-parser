module.exports.parse = async (raw, { axios, yaml, notify, console }, { name, url, interval, selected }) => {
    console.log("111")
    const obj = yaml.parse(raw)
    console.log(obj)
    let s = yaml.stringify(obj);
    console.log(s)
    return s
}