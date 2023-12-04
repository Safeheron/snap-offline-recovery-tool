import { useState, useEffect } from "react";
import RecoveryPage from "./Recovery";

const LandingPage = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isRecoveryPage, showRecoveryPage] = useState(false)

  useEffect(() => {
    window.addEventListener("online", setOnlineState);
    window.addEventListener("offline", setOnlineState);

    return () => {
      window.removeEventListener("online", setOnlineState);
      window.removeEventListener("offline", setOnlineState);
    };
  }, []);

  useEffect(() => {
    if (isOnline) {
      showRecoveryPage(false)
    }
  }, [isOnline])

  const setOnlineState = () => {
    setIsOnline(navigator.onLine);
  };

  if (isRecoveryPage) {
    return <RecoveryPage />
  }

  return (
    <div className="flex flex-col items-center mt-20">
      <h3 className="title is-3">Recover Your Private Key</h3>
      <p>
        Use 3 private key shards to recover the private key and import it into
        MetaMask or other wallets to use the same Snap account.
      </p>
      <p className="mt-20 text-orange-500">
        For the security of your wallet, please operate in an offline
        environment.
      </p>
      <button
        className="button is-link mt-5"
        disabled={isOnline}
        onClick={() => showRecoveryPage(true)}
      >
        Start to Recover
      </button>
    </div>
  );
};

export default LandingPage;
