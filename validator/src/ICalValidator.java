import net.fortuna.ical4j.data.CalendarBuilder;
import net.fortuna.ical4j.data.ParserException;
import net.fortuna.ical4j.model.Calendar;
import net.fortuna.ical4j.model.Component;
import net.fortuna.ical4j.model.Property;
import net.fortuna.ical4j.model.component.VEvent;
import net.fortuna.ical4j.validate.ValidationException;
import net.fortuna.ical4j.validate.ValidationResult;

import java.io.FileInputStream;
import java.io.IOException;
import java.io.StringReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

/**
 * Command-line iCalendar validator using ical4j library.
 * Usage: java ICalValidator <file.ics | --stdin>
 * Exit codes: 0 = valid, 1 = invalid, 2 = error
 */
public class ICalValidator {

    public static void main(String[] args) {
        if (args.length < 1) {
            System.err.println("Usage: java ICalValidator <file.ics | --stdin>");
            System.err.println("       Validates an iCalendar file against RFC 5545");
            System.exit(2);
        }

        String input = args[0];

        try {
            Calendar calendar;
            CalendarBuilder builder = new CalendarBuilder();

            if ("--stdin".equals(input)) {
                // Read from stdin
                StringBuilder sb = new StringBuilder();
                int ch;
                while ((ch = System.in.read()) != -1) {
                    sb.append((char) ch);
                }
                calendar = builder.build(new StringReader(sb.toString()));
            } else {
                // Read from file
                Path filePath = Path.of(input);
                if (!Files.exists(filePath)) {
                    System.err.println("ERROR: File not found: " + input);
                    System.exit(2);
                }
                try (FileInputStream fis = new FileInputStream(input)) {
                    calendar = builder.build(fis);
                }
            }

            // Perform validation
            ValidationResult result = calendar.validate();

            if (result.hasErrors()) {
                System.out.println("VALIDATION FAILED");
                System.out.println("==================");
                result.getEntries().forEach(entry -> {
                    System.out.println("- " + entry.getMessage() + " [" + entry.getSeverity() + "]");
                });
                System.exit(1);
            } else {
                System.out.println("VALIDATION PASSED");
                System.out.println("==================");

                // Print summary
                System.out.println("Calendar Properties:");
                System.out.println("  PRODID: " + getPropertyValue(calendar, Property.PRODID));
                System.out.println("  VERSION: " + getPropertyValue(calendar, Property.VERSION));

                List<VEvent> events = calendar.getComponents(Component.VEVENT);
                System.out.println("Events: " + events.size());

                for (VEvent event : events) {
                    System.out.println("  - " + getPropertyValue(event, Property.SUMMARY));
                    System.out.println("    DTSTART: " + getPropertyValue(event, Property.DTSTART));
                    if (event.getProperty(Property.RRULE).isPresent()) {
                        System.out.println("    RRULE: " + getPropertyValue(event, Property.RRULE));
                    }
                }

                if (!result.getEntries().isEmpty()) {
                    System.out.println("\nWarnings:");
                    result.getEntries().forEach(entry -> {
                        System.out.println("  - " + entry.getMessage() + " [" + entry.getSeverity() + "]");
                    });
                }

                System.exit(0);
            }

        } catch (ParserException e) {
            System.err.println("PARSE ERROR: " + e.getMessage());
            System.exit(2);
        } catch (IOException e) {
            System.err.println("IO ERROR: " + e.getMessage());
            System.exit(2);
        } catch (Exception e) {
            System.err.println("ERROR: " + e.getMessage());
            e.printStackTrace();
            System.exit(2);
        }
    }

    private static String getPropertyValue(Calendar calendar, String propertyName) {
        return calendar.getProperty(propertyName)
                .map(Property::getValue)
                .orElse("N/A");
    }

    private static String getPropertyValue(VEvent event, String propertyName) {
        return event.getProperty(propertyName)
                .map(Property::getValue)
                .orElse("N/A");
    }
}
