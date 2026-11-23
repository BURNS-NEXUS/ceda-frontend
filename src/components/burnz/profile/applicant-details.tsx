import type { ApplicationDetailOut } from "@/lib/api/client";
import DetailField from "./detail-field";

interface ApplicantDetailsProps {
  detail: ApplicationDetailOut;
}

interface RecordBlockProps {
  label: string;
  hasData: boolean;
  children: React.ReactNode;
}

function RecordBlock({ label, hasData, children }: RecordBlockProps) {
  return (
    <div className="rounded-lg border border-gray-100 p-3 dark:border-ink-800">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </p>
      {hasData ? (
        <dl className="grid gap-3 sm:grid-cols-2">{children}</dl>
      ) : (
        <p className="text-sm italic text-gray-400 dark:text-gray-500">
          Not provided on this application.
        </p>
      )}
    </div>
  );
}

/**
 * Applicant-level records attached to the selected application. The seeded
 * applications leave these empty, so each block states that honestly instead
 * of inventing values.
 */
export default function ApplicantDetails({ detail }: ApplicantDetailsProps) {
  const personal = detail.personal_details?.[0];
  const corporate = detail.corporate_details?.[0];
  const address = detail.addresses?.[0];
  const contacts = detail.contacts ?? [];

  return (
    <div className="space-y-3 border-t border-gray-100 pt-5 dark:border-ink-800">
      <h3 className="text-sm font-semibold text-ink-800 dark:text-white">
        Applicant details
      </h3>

      <RecordBlock label="Personal details" hasData={Boolean(personal)}>
        {personal ? (
          <>
            <DetailField label="Title" value={personal.title} />
            <DetailField label="Surname" value={personal.surname} />
            <DetailField label="Other names" value={personal.other_names} />
            <DetailField label="ID number" value={personal.id_number} />
            <DetailField label="Date of birth" value={personal.date_of_birth} />
            <DetailField label="Marital status" value={personal.marital_status} />
          </>
        ) : null}
      </RecordBlock>

      <RecordBlock label="Corporate details" hasData={Boolean(corporate)}>
        {corporate ? (
          <>
            <DetailField label="Company name" value={corporate.name_of_company} />
            <DetailField label="Date of incorporation" value={corporate.date_of_incorporation} />
            <DetailField label="Nature of company" value={corporate.nature_of_company} />
          </>
        ) : null}
      </RecordBlock>

      <RecordBlock label="Address" hasData={Boolean(address)}>
        {address ? (
          <>
            <DetailField label="Postal address" value={address.postal_address} />
            <DetailField label="Physical address" value={address.physical_address} />
            <DetailField label="Duration of stay" value={address.duration_of_stay} />
          </>
        ) : null}
      </RecordBlock>

      <RecordBlock label="Contacts" hasData={contacts.length > 0}>
        {contacts.map((contact) => (
          <DetailField
            key={contact.id}
            label={contact.contact_type || "Contact"}
            value={[contact.contact_value, contact.email].filter(Boolean).join(" · ") || undefined}
          />
        ))}
      </RecordBlock>
    </div>
  );
}
