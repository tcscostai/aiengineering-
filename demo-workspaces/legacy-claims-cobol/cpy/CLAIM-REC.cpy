      ******************************************************************
      * COPYBOOK: CLAIM-REC                                           *
      * Institutional / professional claim header                       *
      ******************************************************************
       01  CLAIM-RECORD.
           05  CLM-NUMBER             PIC X(15).
           05  CLM-MEMBER-ID          PIC X(12).
           05  CLM-SERVICE-DATE       PIC 9(08).
           05  CLM-PROC-CODE          PIC X(05).
           05  CLM-DIAG-CODE          PIC X(07).
           05  CLM-BILLED-AMT         PIC S9(09)V99 COMP-3.
           05  CLM-ALLOWED-AMT        PIC S9(09)V99 COMP-3.
           05  CLM-PAID-AMT           PIC S9(09)V99 COMP-3.
           05  CLM-STATUS             PIC X(02).
               88  CLM-PENDING        VALUE 'PN'.
               88  CLM-ADJUDICATED    VALUE 'AD'.
               88  CLM-DENIED         VALUE 'DN'.
           05  CLM-PRIOR-AUTH-NUM     PIC X(12).
           05  CLM-FILLER             PIC X(30).
