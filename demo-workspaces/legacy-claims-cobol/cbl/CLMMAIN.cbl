       IDENTIFICATION DIVISION.
       PROGRAM-ID. CLMMAIN.
      ******************************************************************
      * CLMMAIN — Claims batch driver (nightly adjudication cycle)      *
      * Calls: CLMVAL, ELIGCHK, CLMADJ, PASAUTH                       *
      ******************************************************************
       ENVIRONMENT DIVISION.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
           COPY MEMBER-REC.
           COPY CLAIM-REC.
           COPY ELIG-REC.
           01  WS-COUNTERS.
               05  WS-CLAIMS-READ     PIC 9(09) VALUE ZERO.
               05  WS-CLAIMS-PAID     PIC 9(09) VALUE ZERO.
           01  WS-DB2-TOKEN           PIC X(16) VALUE 'DB2-CLAIMS-PROD'.
      * FIXME: replace flat file bridge before cloud cutover
       PROCEDURE DIVISION.
           DISPLAY 'CLMMAIN STARTED'.
           PERFORM UNTIL WS-CLAIMS-READ > 5000
               CALL 'CLMVAL' USING CLAIM-RECORD
               CALL 'ELIGCHK' USING MEMBER-RECORD ELIG-RECORD
               CALL 'CLMADJ' USING CLAIM-RECORD
               IF CLM-PRIOR-AUTH-NUM NOT = SPACES
                   CALL 'PASAUTH' USING CLAIM-RECORD
               END-IF
               ADD 1 TO WS-CLAIMS-READ
           END-PERFORM.
           DISPLAY 'CLMMAIN COMPLETE'.
           STOP RUN.
