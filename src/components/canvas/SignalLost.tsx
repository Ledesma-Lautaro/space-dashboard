import styles from "./SignalLost.module.css";

const SIGNAL_LOST_HEADING = ">> SIGNAL LOST";
const SIGNAL_LOST_READOUT = "[ RECONNECTING TO RENDER TARGET ]";

export function SignalLost() {
  return (
    <div className={styles.root} role="status">
      <p className={styles.heading}>{SIGNAL_LOST_HEADING}</p>
      <p className={styles.subheading}>{SIGNAL_LOST_READOUT}</p>
    </div>
  );
}