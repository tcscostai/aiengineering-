      ******************************************************************
      * COPYBOOK: ELIG-REC                                            *
      * Eligibility response segment                                  *
      ******************************************************************
       01  ELIG-RECORD.
           05  ELIG-MEMBER-ID         PIC X(12).
           05  ELIG-EFFECT-DATE       PIC 9(08).
           05  ELIG-TERM-DATE         PIC 9(08).
           05  ELIG-COVERAGE-TYPE     PIC X(03).
           05  ELIG-COB-INDICATOR     PIC X(01).
           05  ELIG-FHIR-READY        PIC X(01) VALUE 'N'.
           05  ELIG-FILLER            PIC X(40).
