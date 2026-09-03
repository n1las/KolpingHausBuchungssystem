# Situation

Das hier ist ein Protoyp von einer Website für einer meiner Kunden der muss jetzt weiterentwickelt werden und auf neuere Anfroderungen angepasst werden, er sollte aber später erweiterbar sein damit man damit dann eine richtige Webaplikation mit Frontend und Backend draus machen kann gerade reicht es aber wenn sie aus JS html css etc besteht.

+ Hinweis wenn von der Darstellung in diesem Plan geredet wird ist damit das SVG auf der linken Seite der WEbsite gemeint.

## Neue Anforderungen

### Darstellung

+ man soll jetzt in der Lage sein die Darstellung sich dynamisch anzeigen zu lassen, man kann also auswählen ob man nur das OG, EG, UG oder alles gleichzeitig sehen will also genau so wie es gerade der Fall ist. Man sollte das ganze einfach simpel über 4 knöpfe neber der Darstellung auswählen können. die Räume sind wie folgt geglieder.
+ OG: Kolpingzimmer, Gaalbernstube, Galerie
+ EG: Landernau, Neustadt, Foyer, Gasstätte, Hessisches Kegelspiel, Hauptsaal, Wintergarten
+ UG: Kegelbahn 1, Kegelbahn 2.

+ Farben: Termine haben verschieden Farben je nachdem von welchem Accounttyp sie erstellt wurden müssen sie mit folgender Frabe im Kalender und in der Darstellung gezeigt werden: Normale Termine(von Stadt-Mitarbeitern) Blau, Termine von Gastro-Mitarbeitern Gelb. Tipp die Rollen werden im nacher im Plan nochmal genauer beschreiben.
## restliche Anforderungen
+ Filter Funktion
    + Simple Filter Funktion die es einem erstmal erlaubt nur Termnine im Kalender und in der Darstellung zu sehen die von den beiden Account typen gemacht wurden
    + also mann kann einfach filtern will ich nur die Termine von Gastro-Mitarbeitern, Stadt-Mitarbeitern oder beide gleichzeitig sehen
+ Login-System/ Accounts mit verschiedenen Berechtigungen
    + es soll bevor man irgendwelche Termine hat einen simplen Login mit Name und Passwort geben diese Accounts sollen dann noch eine von 2 Rollen haben
        + Rolle 1: Stadt-Mitarbeiter -> kann alles machen also Termine erstellen löschen etc. es werden nach Login aber erstmal auch nur Termine angezeigt die auch von Accounts vom Typ Stadt-Mitarbeiter gemacht wurden angezeigt, mit der Filter Funktion kann man dann einstellen das man ebenfalls die Termine von Gastro-Mitarbeitern sieht
        + Rolle 2: Gastro-Mitarbeiter: können auch Termine erstellen aber keine Löschen. Wenn sie sich einloggen werden automatisch alle Termine angzeigt, sie können aber auch die Filter Funktion verwenden.

+ Termine müssen in mehreren Räumen gleichzeitig stattfinden können -> das heißt im Kalender müssen die Termine zussammen dargestellt werden links in der Darstellung würde ich jedoch erstmal bei der Dartsellung bleiben, dass die Termine mit Uhrzeit und name in beiden Räumen angezeigt wird dann halt nur mit gleichen farben dazu kommen wir aber gleich noch im detail


+ Termine brauchen neue eigenschaften bzw es müssen eigenschaften angepasst werden:
    + Eigenschaft Vertrag muss hinzugefügt werden mann muss erst eine checkbox anklicken, ob ein Vertrag vorhanden ist, dann kann man in einem Dropown Menü auswählen ob er erstellt gesendet oder unterschreiben ist
    + Mieter sollte zu Ansprechpartner unbenannt werden, dann muss dannach zwei felder kommen von den mindestens eins einen gültigen eintrag haben muss und zwar Email des Ansprechpartners oder Telefonnummer des Ansprechpartners
    + Es wird ein login-System mit Accounts geben, wenn jemand ein Termin erstellt muss automatisch gespeichert werden von welcher Person der Termin erstellt wurde und genau wann er erstellt wurde

+ aktivitäten Feature im Headre der Website sollte eine Glocke sein wenn man auf sie klickt kann man die letzen aktivitäten sehen damit ist folgendes gemeint: Hier wird kurz aufgelistet werlcher Account was für einen Termin hinzugefügt, modifiziert oder gelöscht hat. könnte z.B. so aussehen: Tim hat den Termin Trainsabend SKC am 20.09.2026 bearbeitetet am 10.09. um 12 Uhr.

## Constraints

+ wir verwenden Aktuell die JS-Bibliothek FullCalendar es dürfen auf gar keinen Fall Premium features davon verwendet werden nur die die in der Standart version vorhanden sind. Falls die genannten Features nicht möglich sind mit den standart Features gebe mir bitte Bescheid



## Vorgehen

Das ganze soll wie gesagt noch keine klassische WebApp mit Backend/Datenbank usw. sein sondern erstmal ein Prototyp mit dem aber mein kunden schonmal in einer live-Demo arbeiten können. Später sollten wir aber in der Lage sein mit nicht alzu vielen anpasungen daruas ein echte WebApp zu bauen..

Erstelle zuerst einen Plan namens VibeCodePlan.md indem du genau beschreibst wie du diese Features umsetzen würst. Du kannst auch gerne noch Fragen stellen fals einzelheiten noch nicht klar sind.