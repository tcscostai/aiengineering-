      ******************************************************************
      * COPYBOOK: MEMBER-REC                                          *
      * Member demographic layout for claims processing               *
      ******************************************************************
       01  MEMBER-RECORD.
           05  MEM-ID                 PIC X(12).
           05  MEM-SSN                PIC X(09).
           05  MEM-LAST-NAME          PIC X(30).
           05  MEM-FIRST-NAME         PIC X(20).
           05  MEM-DOB                PIC 9(08).
           05  MEM-PLAN-CODE          PIC X(04).
           05  MEM-ELIG-STATUS        PIC X(01).
               88  MEM-ACTIVE         VALUE 'A'.
               88  MEM-TERMINATED     VALUE 'T'.
           05  MEM-HIPAA-FLAG         PIC X(01).
           05  MEM-FILLER             PIC X(20).
