import { BundleEntry, Condition, OperationOutcome } from "fhir/r2";
import { useEffect, useState } from "react";
import {
  EpicAuthResponse,
  getFHIRResource,
  getLoginUrl,
} from "../services/epic";
import { getLastConnection, storeConnection } from "../services/epic-connection-store";

export default function App() {
  const [con, setCon] = useState<
    (EpicAuthResponse & { expires_at: number }) | undefined
  >();
  const [patientData, setPatientData] =
    useState<BundleEntry<Condition | OperationOutcome>[]>();
  const [expiresAt, setExpiresAt] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    getLastConnection().then((con) => {
      setCon(con);
    });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (con?.expires_at) {
        const nowInSeconds = Math.floor(Date.now() / 1000);
        setExpiresAt(con?.expires_at - nowInSeconds);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [con?.expires_at]);

  return (
    <div>
      <header>
        <h1>Epic FHIR Demo</h1>
      </header>
      <main>
        <a href={getLoginUrl()}>
          <button type="button">Login to MyChart</button>
        </a>
        <section>
          <h2>Sandbox credentials:</h2>
          <p>
            username: <code>fhirderrick</code>
          </p>
          <p>
            password: <code>epicepic1</code>
          </p>
        </section>
        {con ? (
          <article>
            <h2>Connection Data</h2>
            <p>
              {expiresAt > 0
                ? `Token expires in: ${expiresAt} seconds`
                : "Token Expired"}
            </p>
            <details>
              <summary>Raw Response Data</summary>
              <pre>{JSON.stringify(con, null, 2)}</pre>
            </details>
          </article>
        ) : (
          <article>
            After you log in, your connection data will show here
          </article>
        )}
        {con ? (
          <article>
            <h2>Fetch patient data from FHIR API using access token</h2>
            <button
              disabled={isRefreshing}
              onClick={async () => {
                try {
                  setIsRefreshing(true);
                  setPatientData(
                    await getFHIRResource(con.access_token, "Condition", {
                      patient: con.patient,
                    })
                  );
                  setIsRefreshing(false);
                } catch (e) {
                  setIsRefreshing(false);
                }
              }}
            >
              {isRefreshing ? "Refreshing" : "Get Patient Conditions"}
            </button>
            {patientData && (
              <details>
                <summary>Raw Response Data</summary>
                <pre>{JSON.stringify(patientData, null, 2)}</pre>
              </details>
            )}
          </article>
        ) : null}
      </main>
    </div>
  );
}