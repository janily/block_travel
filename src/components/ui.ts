import styles from "./ui.module.css";
export function css(classes:string) { return classes.split(" ").map(name=>styles[name] ?? name).join(" "); }
