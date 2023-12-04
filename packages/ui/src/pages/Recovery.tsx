import { useMemo, useState } from "react";
import { checkMnemonic } from "../utils/mnemonic";
import { RecoveryTools } from "@safeheron/mm-key-recovery";
import { toast, ToastContainer } from "react-toastify";
import BN from "bn.js";

interface KeyShare {
  A: string;
  B: string;
  C: string;
}

type KeyShareErrMsg = KeyShare;

type Name = keyof KeyShare;

const defaultValue = {
  A: "",
  B: "",
  C: "",
};

const keyShareNames: Name[] = ["A", "B", "C"];

const RecoveryPage = () => {
  const [errMsgs, setErrMsgs] = useState<KeyShareErrMsg>(defaultValue);
  const [keyShares, setKeyShares] = useState<KeyShare>(defaultValue);
  const [privateKey, setPrivateKey] = useState("");

  const disabled = useMemo(() => {
    const hasErr = (Object.keys(errMsgs) as Name[]).some(
      (name) => !!errMsgs[name]
    );
    const lackKeyShare =
      (Object.keys(keyShares) as Name[]).filter((name) => !!keyShares[name])
        .length < 2;
    return hasErr || lackKeyShare;
  }, [errMsgs, keyShares]);

  const onChange = (value: string, name: Name) => {
    const newKeyShares = { ...keyShares };

    newKeyShares[name] = value;

    setPrivateKey("");
    setKeyShares(newKeyShares);

    let errMsg = "";
    const msgs = { ...errMsgs };
    if (newKeyShares[name]) {
      const mnemonics = value.trim().split(/\s+/g);
      errMsg = checkMnemonic(mnemonics);
      msgs[name] = errMsg;
    } else {
      msgs[name] = errMsg;
    }
    setErrMsgs(msgs);
  };

  const onPaste = async (name: Name) => {
    try {
      const text = await navigator.clipboard.readText();
      onChange(text, name);
    } catch (err) {
      console.log(err);
    }
  };

  const onCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied successfully", { autoClose: 1500 });
    } catch (err) {
      toast.success("Copy failed", { autoClose: 1500 });
      console.log(err);
    }
  };

  const onRecover = () => {
    const names = (Object.keys(keyShares) as Name[]).filter(
      (name) => !!keyShares[name]
    );
    const indexArr = names.map((name) => {
      let i;
      switch (name) {
        case "A":
          i = 1;
          break;
        case "B":
          i = 2;
          break;
        case "C":
          i = 3;
          break;
      }
      return new BN(i);
    });
    const ks = names.map((name) =>
      keyShares[name].trim().split(/\s+/g).join(" ")
    );

    try {
      const result = RecoveryTools.RecoveryKeyFromShares(
        names.length,
        indexArr,
        ks
      );
      setPrivateKey(result);
    } catch (err: any) {
      setPrivateKey("");
      toast.error(err.message, { autoClose: 3000 });
      console.error(err);
    }
  };

  return (
    <div className="lg:w-4/6 m-auto">
      <h3 className="title is-3 text-center mt-20">
        Fill in at least 2 mnemonic phrases for the key shards
      </h3>
      <div className="m-auto pt-5">
        {keyShareNames.map((item) => {
          return (
            <div className="field" key={item}>
              <div className="flex items-center justify-between">
                <label className="label">
                  Mnemonic phrase for private key shard {item}
                </label>
                <div
                  className="cursor-pointer has-text-link text-sm mb-1"
                  onClick={() => onPaste(item)}
                >
                  Paste
                </div>
              </div>
              <div className="control">
                <textarea
                  className="textarea"
                  placeholder="Please enter 24 words separated by spaces"
                  value={keyShares[item]}
                  onChange={(evt) => onChange(evt.target.value, item)}
                />
              </div>
              {errMsgs[item] && (
                <p className="help is-danger">{errMsgs[item]}</p>
              )}
            </div>
          );
        })}
        {privateKey && (
          <div className="field">
            <div className="flex items-center justify-between">
              <label className="label">Recovered Private Key</label>
              <div
                className="cursor-pointer has-text-link text-sm mb-1"
                onClick={() => onCopy(privateKey)}
              >
                Copy
              </div>
            </div>
            <div className="control">
              <input className="input" disabled value={privateKey} />
            </div>
          </div>
        )}
      </div>
      <button
        className="button is-link mt-6 w-full"
        disabled={disabled}
        onClick={onRecover}
      >
        Recover Now
      </button>
      <ToastContainer />
    </div>
  );
};

export default RecoveryPage;
