       IDENTIFICATION DIVISION.
       PROGRAM-ID. ELIGCHK.
      ******************************************************************
      * ELIGCHK — Member eligibility verification                       *
      ******************************************************************
       DATA DIVISION.
       WORKING-STORAGE SECTION.
           COPY MEMBER-REC.
           COPY ELIG-REC.
       LINKAGE SECTION.
           01  LK-MEMBER              PIC X(100).
           01  LK-ELIG                PIC X(80).
       PROCEDURE DIVISION USING LK-MEMBER LK-ELIG.
           MOVE LK-MEMBER TO MEMBER-RECORD.
           MOVE MEM-ID TO ELIG-MEMBER-ID.
           IF MEM-ACTIVE
               MOVE 'A' TO ELIG-COVERAGE-TYPE
           ELSE
               MOVE 'T' TO ELIG-COVERAGE-TYPE
           END-IF.
           MOVE ELIG-RECORD TO LK-ELIG.
           GOBACK.
