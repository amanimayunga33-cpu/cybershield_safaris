/**
 * Amani Bus Booking System — Java utility module.
 * Demonstrates fare calculation and booking validation logic in Java,
 * which can be dropped into a Spring Boot microservice if the system is later
 * split into multiple language-specific services (e.g. a Java-based fare/rules engine
 * alongside the Node.js API).
 *
 * Compile:  javac BookingValidator.java
 * Run:      java BookingValidator
 */
import java.util.*;

public class BookingValidator {

    static final Set<String> VALID_TOWNS = new HashSet<>(Arrays.asList(
        "Arusha", "Dar es Salaam", "Geita", "Kahama", "Mbeya"
    ));

    static final Map<String, Double> VIP_SURCHARGE = new HashMap<>();
    static {
        VIP_SURCHARGE.put("VIP", 1.25);      // VIP seats cost 25% more
        VIP_SURCHARGE.put("Ordinary", 1.0);
    }

    /** Validates that both towns exist in the network and are not identical. */
    public static boolean isValidRoute(String from, String to) {
        return VALID_TOWNS.contains(from) && VALID_TOWNS.contains(to) && !from.equals(to);
    }

    /** Calculates total fare given a base fare, seat class, and number of seats. */
    public static double calculateFare(double baseFare, String busClass, int seatCount) {
        double multiplier = VIP_SURCHARGE.getOrDefault(busClass, 1.0);
        return baseFare * multiplier * seatCount;
    }

    /** Validates a Tanzanian phone number for SMS delivery (e.g. +2557XXXXXXXX). */
    public static boolean isValidTanzanianPhone(String phone) {
        return phone != null && phone.matches("^(\\+255|0)7\\d{8}$");
    }

    public static void main(String[] args) {
        System.out.println("Route Arusha -> Mbeya valid? " + isValidRoute("Arusha", "Mbeya"));
        System.out.println("Fare for 2 VIP seats @ 40000 base: " + calculateFare(40000, "VIP", 2));
        System.out.println("Phone +255712345678 valid? " + isValidTanzanianPhone("+255712345678"));
    }
}
